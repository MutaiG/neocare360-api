// NeoCare360 Production API - Clinical Alerts
// GET /api/v1/alerts/clinical

import { dbHelpers } from '../../../../lib/supabase';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { hospital_id } = req.query;

        // Get active clinical alerts (patient-related)
        const { data: alerts, error } = await dbHelpers.getActiveAlerts(hospital_id);

        if (error) {
            throw new Error(`Failed to fetch clinical alerts: ${error.message}`);
        }

        // Filter to only patient-related alerts and group by category
        const patientAlerts = alerts.filter((alert) => alert.patient_id !== null);

        // Group by category
        const alertsByCategory = patientAlerts.reduce((acc, alert) => {
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

        res.status(200).json({
            alerts: Object.values(alertsByCategory),
            totalAlerts: patientAlerts.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Clinical Alerts API Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
}

function getCategoryIcon(category) {
    const icons = {
        cardiac: '❤️',
        respiratory: '🫁',
        neurological: '🧠',
        metabolic: '⚡',
        temperature: '🌡️',
        medication: '💊',
        equipment: '🔧',
        capacity: '🏥',
    };
    return icons[category?.toLowerCase()] || '⚠️';
}

function getCategoryDescription(category) {
    const descriptions = {
        cardiac: 'Irregular heart rhythms detected',
        respiratory: 'Low oxygen saturation alerts',
        neurological: 'Consciousness level changes',
        metabolic: 'Blood sugar fluctuations',
        temperature: 'Fever and temperature alerts',
        medication: 'Medication and dosage alerts',
        equipment: 'Medical equipment issues',
        capacity: 'Hospital capacity warnings',
    };
    return descriptions[category?.toLowerCase()] || 'General clinical alerts';
}

function getSeverityWeight(severity) {
    const weights = { low: 1, medium: 2, high: 3, critical: 4 };
    return weights[severity] || 0;
}
