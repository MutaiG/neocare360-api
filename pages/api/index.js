// NeoCare360 Production API - Index
// GET /api

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiInfo = {
        name: 'NeoCare360 Production API',
        version: '1.0.0',
        description: 'Healthcare Intelligence Platform API for Kenya',
        documentation: 'https://your-api-docs.vercel.app',
        status: 'operational',
        timestamp: new Date().toISOString(),
        endpoints: {
            overview: {
                dashboard: {
                    url: '/api/v1/overview/dashboard',
                    method: 'GET',
                    description: 'Complete dashboard overview data',
                    parameters: ['hospital_id', 'county_id', 'timeframe'],
                },
            },
            patients: {
                monitoring: {
                    url: '/api/v1/patients/monitoring',
                    method: 'GET',
                    description: 'Active patient monitoring data',
                    parameters: ['hospital_id', 'ward', 'status', 'limit'],
                },
                vitals: {
                    url: '/api/v1/patients/vitals/live',
                    method: 'GET',
                    description: 'Live patient vital signs',
                    parameters: ['hospital_id', 'limit'],
                },
                distribution: {
                    url: '/api/v1/patients/distribution',
                    method: 'GET',
                    description: 'Patient geographic distribution',
                    parameters: ['hospital_id', 'county_id'],
                },
            },
            icu: {
                'command-center': {
                    url: '/api/v1/icu/command-center',
                    method: 'GET',
                    description: 'ICU capacity, patients, and equipment',
                    parameters: ['hospital_id'],
                },
            },
            clinical: {
                kpis: {
                    url: '/api/v1/kpis/clinical',
                    method: 'GET',
                    description: 'Clinical key performance indicators',
                    parameters: ['hospital_id', 'timeframe'],
                },
            },
            departments: {
                performance: {
                    url: '/api/v1/departments/performance',
                    method: 'GET',
                    description: 'Department performance metrics',
                    parameters: ['hospital_id', 'days'],
                },
            },
            resources: {
                beds: {
                    url: '/api/v1/resources/beds',
                    method: 'GET',
                    description: 'Hospital bed resources and occupancy',
                    parameters: ['hospital_id'],
                },
                staff: {
                    url: '/api/v1/resources/staff',
                    method: 'GET',
                    description: 'Staff resources and nurse-patient ratios',
                    parameters: ['hospital_id'],
                },
                supplies: {
                    url: '/api/v1/resources/supplies',
                    method: 'GET',
                    description: 'Medical supply inventory status',
                    parameters: ['hospital_id'],
                },
            },
            alerts: {
                critical: {
                    url: '/api/v1/alerts/critical',
                    method: 'GET',
                    description: 'Critical hospital alerts',
                    parameters: ['hospital_id', 'limit'],
                },
                clinical: {
                    url: '/api/v1/alerts/clinical',
                    method: 'GET',
                    description: 'Clinical patient alerts by category',
                    parameters: ['hospital_id'],
                },
            },
            laboratory: {
                metrics: {
                    url: '/api/v1/laboratory/metrics',
                    method: 'GET',
                    description: 'Laboratory testing metrics and turnaround times',
                    parameters: ['hospital_id', 'timeframe'],
                },
            },
        },
        authentication: {
            type: 'Bearer Token',
            header: 'Authorization: Bearer <token>',
            note: 'Authentication required for production use',
        },
        rateLimit: {
            window: '15 minutes',
            maxRequests: 100,
            headers: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
        },
        cors: {
            enabled: true,
            allowedOrigins: ['https://your-frontend-app.vercel.app'],
        },
        support: {
            email: 'api-support@neocare360.com',
            documentation: 'https://docs.neocare360.com',
            github: 'https://github.com/your-org/neocare360-api',
        },
    };

    res.status(200).json(apiInfo);
}
