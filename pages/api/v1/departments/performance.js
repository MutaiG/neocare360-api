// NeoCare360 Production API - Department Performance
// GET /api/v1/departments/performance

import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { hospital_id, days = 30 } = req.query;

        const departmentPerformance = await getDepartmentPerformanceData(
            hospital_id,
            parseInt(days)
        );

        res.status(200).json({
            departments: departmentPerformance.data,
            summary: calculatePerformanceSummary(departmentPerformance.data),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Department Performance API Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
}

async function getDepartmentPerformanceData(hospitalId, days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get department metrics with department info
    let query = supabaseAdmin
        .from('department_metrics')
        .select(
            `
            *,
            department:hospital_departments(
                name,
                code,
                hospital:hospitals(name)
            )
        `
        )
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

    // Filter by hospital if specified
    if (hospitalId) {
        const { data: deptIds } = await supabaseAdmin
            .from('hospital_departments')
            .select('id')
            .eq('hospital_id', hospitalId);

        if (deptIds && deptIds.length > 0) {
            query = query.in(
                'department_id',
                deptIds.map((d) => d.id)
            );
        }
    }

    const { data: metrics, error } = await query;

    if (error) return { data: [], error };

    // Group by department and calculate aggregated performance
    const deptGroups = metrics.reduce((acc, metric) => {
        const deptName = metric.department?.name || 'Unknown';
        if (!acc[deptName]) {
            acc[deptName] = {
                department: deptName,
                code: metric.department?.code || '',
                hospital: metric.department?.hospital?.name || '',
                metrics: [],
            };
        }
        acc[deptName].metrics.push(metric);
        return acc;
    }, {});

    // Calculate performance scores for each department
    const departments = Object.values(deptGroups).map((dept) => {
        const metrics = dept.metrics;
        const count = metrics.length;

        if (count === 0) {
            return {
                department: dept.department,
                avgLOS: 0,
                readmission: 0,
                mortality: 0,
                rating: 'N/A',
                trend: 'stable',
                patientCount: 0,
                satisfactionScore: 0,
            };
        }

        // Calculate averages
        const avgLOS = metrics.reduce((sum, m) => sum + (m.avg_length_of_stay || 0), 0) / count;
        const readmission = metrics.reduce((sum, m) => sum + (m.readmission_rate || 0), 0) / count;
        const mortality = metrics.reduce((sum, m) => sum + (m.mortality_rate || 0), 0) / count;
        const patientCount = metrics.reduce((sum, m) => sum + (m.patient_count || 0), 0);
        const satisfaction =
            metrics.reduce((sum, m) => sum + (m.patient_satisfaction || 0), 0) / count;

        // Calculate trend (comparing first half vs second half of period)
        const midPoint = Math.floor(count / 2);
        const recentMetrics = metrics.slice(0, midPoint);
        const olderMetrics = metrics.slice(midPoint);

        let trend = 'stable';
        if (recentMetrics.length > 0 && olderMetrics.length > 0) {
            const recentAvgMortality =
                recentMetrics.reduce((sum, m) => sum + (m.mortality_rate || 0), 0) /
                recentMetrics.length;
            const olderAvgMortality =
                olderMetrics.reduce((sum, m) => sum + (m.mortality_rate || 0), 0) /
                olderMetrics.length;

            if (recentAvgMortality < olderAvgMortality * 0.9) trend = 'improving';
            else if (recentAvgMortality > olderAvgMortality * 1.1) trend = 'declining';
        }

        // Calculate rating based on multiple factors
        let rating = calculateDepartmentRating(mortality, readmission, satisfaction);

        return {
            department: dept.department,
            avgLOS: parseFloat(avgLOS.toFixed(1)),
            readmission: parseFloat(readmission.toFixed(1)),
            mortality: parseFloat(mortality.toFixed(1)),
            rating,
            trend,
            patientCount: Math.round(patientCount),
            satisfactionScore: parseFloat(satisfaction.toFixed(1)),
            hospital: dept.hospital,
        };
    });

    // Sort by overall performance (lower mortality + lower readmission = better)
    departments.sort((a, b) => a.mortality + a.readmission - (b.mortality + b.readmission));

    return { data: departments, error: null };
}

function calculateDepartmentRating(mortality, readmission, satisfaction) {
    let score = 0;

    // Mortality score (lower is better)
    if (mortality < 1) score += 3;
    else if (mortality < 2) score += 2;
    else if (mortality < 5) score += 1;

    // Readmission score (lower is better)
    if (readmission < 5) score += 3;
    else if (readmission < 8) score += 2;
    else if (readmission < 12) score += 1;

    // Satisfaction score (higher is better)
    if (satisfaction > 4.5) score += 3;
    else if (satisfaction > 4.0) score += 2;
    else if (satisfaction > 3.5) score += 1;

    // Convert score to letter grade
    if (score >= 8) return 'A+';
    if (score >= 7) return 'A';
    if (score >= 5) return 'B+';
    if (score >= 3) return 'B';
    if (score >= 1) return 'C';
    return 'D';
}

function calculatePerformanceSummary(departments) {
    if (!departments || departments.length === 0) {
        return {
            totalDepartments: 0,
            averageMortality: 0,
            averageReadmission: 0,
            topPerformer: null,
            needsAttention: [],
        };
    }

    const totalDepartments = departments.length;
    const averageMortality =
        departments.reduce((sum, d) => sum + d.mortality, 0) / totalDepartments;
    const averageReadmission =
        departments.reduce((sum, d) => sum + d.readmission, 0) / totalDepartments;

    const topPerformer = departments[0]; // Already sorted by performance

    const needsAttention = departments
        .filter((d) => d.rating === 'C' || d.rating === 'D' || d.trend === 'declining')
        .slice(0, 3);

    return {
        totalDepartments,
        averageMortality: parseFloat(averageMortality.toFixed(1)),
        averageReadmission: parseFloat(averageReadmission.toFixed(1)),
        topPerformer: topPerformer ? topPerformer.department : null,
        needsAttention: needsAttention.map((d) => ({
            department: d.department,
            rating: d.rating,
            trend: d.trend,
            mortality: d.mortality,
        })),
    };
}
