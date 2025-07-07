// NeoCare360 Production API - Resource Management - Beds
// GET /api/v1/resources/beds

import { dbHelpers, supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { hospital_id } = req.query;

        // Get bed occupancy data
        const bedOccupancy = await dbHelpers.getBedOccupancy(hospital_id);

        if (bedOccupancy.error) {
            throw new Error(`Failed to fetch bed data: ${bedOccupancy.error.message}`);
        }

        // Transform data to match expected format
        const bedResources = Object.values(bedOccupancy.data).map((hospitalData) => ({
            ward: hospitalData.hospital.name,
            total: hospitalData.total,
            occupied: hospitalData.occupied,
            available: hospitalData.available,
            utilization: hospitalData.occupancyRate,
        }));

        // Calculate totals
        const totalBeds = bedResources.reduce((sum, ward) => sum + ward.total, 0);
        const occupiedBeds = bedResources.reduce((sum, ward) => sum + ward.occupied, 0);

        res.status(200).json({
            bedResources,
            totalBeds,
            occupiedBeds,
            overallUtilization: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Bed Resources API Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
}
