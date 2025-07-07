// NeoCare360 Production API - Live Patient Vitals
// GET /api/v1/patients/vitals/live

import { dbHelpers } from '../../../../../lib/supabase';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { hospital_id, limit = 20 } = req.query;

        // Get latest vital signs
        const { data: vitals, error } = await dbHelpers.getLatestVitals(
            null,
            hospital_id,
            parseInt(limit)
        );

        if (error) {
            throw new Error(`Failed to fetch vital signs: ${error.message}`);
        }

        // Transform to expected format
        const liveVitals = vitals.map((vital) => ({
            patientId: vital.patient?.patient_number || 'Unknown',
            heartRate: vital.heart_rate,
            bloodPressure: `${vital.blood_pressure_systolic}/${vital.blood_pressure_diastolic}`,
            oxygenSat: vital.oxygen_saturation,
            temperature: vital.temperature,
            respiratoryRate: vital.respiratory_rate,
            timestamp: vital.recorded_at,
            ward: vital.admission?.ward || 'Unknown',
            bed: vital.admission?.bed_number || 'Unknown',
        }));

        res.status(200).json({
            vitals: liveVitals,
            count: liveVitals.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Live Vitals API Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
}
