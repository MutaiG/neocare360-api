// NeoCare360 Production API - Patient Monitoring
// GET /api/v1/patients/monitoring

import { dbHelpers, supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { hospital_id, ward, status, limit = 50 } = req.query;

        // Get active patients with latest vitals
        const activePatients = await getActivePatients(hospital_id, ward, status, limit);

        // Get live vital signs
        const liveVitals = await dbHelpers.getLatestVitals(null, hospital_id, limit);

        // Get clinical alerts for patients
        const clinicalAlerts = await getClinicalAlerts(hospital_id);

        const monitoringData = {
            activePatients: activePatients.data,
            liveVitals: liveVitals.data,
            clinicalAlerts: clinicalAlerts.data,
            summary: {
                totalPatients: activePatients.data?.length || 0,
                criticalCount:
                    activePatients.data?.filter((p) => p.status === 'critical')?.length || 0,
                monitoringCount:
                    activePatients.data?.filter((p) => p.status === 'monitoring')?.length || 0,
                stableCount: activePatients.data?.filter((p) => p.status === 'stable')?.length || 0,
            },
            timestamp: new Date().toISOString(),
        };

        res.status(200).json(monitoringData);
    } catch (error) {
        console.error('Patient Monitoring API Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
}

async function getActivePatients(hospitalId, ward, status, limit) {
    let query = supabaseAdmin
        .from('admissions')
        .select(
            `
            id,
            admission_date,
            ward,
            bed_number,
            diagnosis,
            status as admission_status,
            patient:patients(
                id,
                patient_number,
                first_name,
                last_name,
                date_of_birth,
                gender,
                blood_type,
                status
            ),
            hospital:hospitals(name, code),
            attending_physician:neocare_users(full_name, role)
        `
        )
        .eq('status', 'active')
        .order('admission_date', { ascending: false });

    if (hospitalId) query = query.eq('hospital_id', hospitalId);
    if (ward) query = query.eq('ward', ward);
    if (limit) query = query.limit(parseInt(limit));

    const { data, error } = await query;

    if (error) return { data: null, error };

    // Enhance with latest vital signs
    const enhancedPatients = await Promise.all(
        data.map(async (admission) => {
            // Get latest vitals for this patient
            const { data: vitals } = await supabaseAdmin
                .from('vital_signs')
                .select('*')
                .eq('patient_id', admission.patient.id)
                .order('recorded_at', { ascending: false })
                .limit(1);

            const latestVitals = vitals && vitals.length > 0 ? vitals[0] : null;

            // Calculate age
            const age = admission.patient.date_of_birth
                ? Math.floor(
                      (new Date() - new Date(admission.patient.date_of_birth)) /
                          (365.25 * 24 * 60 * 60 * 1000)
                  )
                : null;

            return {
                id: admission.patient.patient_number,
                name: `${admission.patient.first_name} ${admission.patient.last_name}`,
                age,
                room: admission.bed_number || admission.ward,
                condition: admission.diagnosis,
                heartRate: latestVitals?.heart_rate || null,
                bloodPressure: latestVitals
                    ? `${latestVitals.blood_pressure_systolic}/${latestVitals.blood_pressure_diastolic}`
                    : null,
                oxygenSat: latestVitals?.oxygen_saturation || null,
                temperature: latestVitals?.temperature || null,
                status: admission.patient.status,
                lastUpdate: latestVitals?.recorded_at || admission.admission_date,
                ward: admission.ward,
                attendingPhysician: admission.attending_physician?.full_name || 'Not assigned',
            };
        })
    );

    // Filter by patient status if specified
    const filteredPatients = status
        ? enhancedPatients.filter((p) => p.status === status)
        : enhancedPatients;

    return { data: filteredPatients, error: null };
}

async function getClinicalAlerts(hospitalId) {
    const { data: alerts, error } = await supabaseAdmin
        .from('alerts')
        .select(
            `
            id,
            title,
            message,
            severity,
            category,
            created_at,
            is_acknowledged,
            patient:patients(patient_number, first_name, last_name)
        `
        )
        .eq('is_resolved', false)
        .not('patient_id', 'is', null) // Only patient-related alerts
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) return { data: null, error };

    // Group alerts by category
    const alertsByCategory = alerts.reduce((acc, alert) => {
        const category = alert.category || 'General';
        if (!acc[category]) {
            acc[category] = {
                category,
                count: 0,
                severity: 'low',
                icon: getCategoryIcon(category),
                description: getCategoryDescription(category),
                alerts: [],
            };
        }

        acc[category].count++;
        acc[category].alerts.push(alert);

        // Set highest severity
        if (getSeverityWeight(alert.severity) > getSeverityWeight(acc[category].severity)) {
            acc[category].severity = alert.severity;
        }

        return acc;
    }, {});

    return { data: Object.values(alertsByCategory), error: null };
}

function getCategoryIcon(category) {
    const icons = {
        cardiac: '❤️',
        respiratory: '🫁',
        neurological: '🧠',
        metabolic: '⚡',
        temperature: '🌡️',
        medication: '💊',
    };
    return icons[category?.toLowerCase()] || '⚠️';
}

function getCategoryDescription(category) {
    const descriptions = {
        cardiac: 'Heart rhythm and circulation alerts',
        respiratory: 'Breathing and oxygen level alerts',
        neurological: 'Consciousness and neurological alerts',
        metabolic: 'Blood sugar and metabolic alerts',
        temperature: 'Fever and temperature alerts',
        medication: 'Medication and dosage alerts',
    };
    return descriptions[category?.toLowerCase()] || 'General clinical alerts';
}

function getSeverityWeight(severity) {
    const weights = { low: 1, medium: 2, high: 3, critical: 4 };
    return weights[severity] || 0;
}
