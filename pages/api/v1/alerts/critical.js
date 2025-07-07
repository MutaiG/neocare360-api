// NeoCare360 Production API - Critical Alerts
// GET /api/v1/alerts/critical

import { dbHelpers } from '../../../../lib/supabase';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { hospital_id, limit = 10 } = req.query;

        // Get critical alerts
        const { data: alerts, error } = await dbHelpers.getActiveAlerts(hospital_id, 'critical');

        if (error) {
            throw new Error(`Failed to fetch critical alerts: ${error.message}`);
        }

        // Transform alerts to match expected format
        const criticalAlerts = alerts.slice(0, parseInt(limit)).map((alert, index) => ({
            id: alert.id,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            timestamp: formatTimeAgo(alert.created_at),
            priority: index + 1,
            patient: alert.patient
                ? `${alert.patient.first_name} ${alert.patient.last_name}`
                : null,
            category: alert.category,
            isAcknowledged: alert.is_acknowledged,
        }));

        res.status(200).json({
            criticalAlerts,
            totalCount: alerts.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Critical Alerts API Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
}

function formatTimeAgo(dateString) {
    const now = new Date();
    const alertTime = new Date(dateString);
    const diffMinutes = Math.floor((now - alertTime) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
