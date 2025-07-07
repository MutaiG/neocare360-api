// Supabase Client Configuration for NeoCare360 Production API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Server-side only
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Client-side

if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

// Server-side client with service role (bypass RLS for admin operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// Client-side client with anonymous key (respects RLS)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get user-aware client
export const getSupabaseClient = (userToken = null) => {
    if (userToken) {
        const client = createClient(supabaseUrl, supabaseAnonKey);
        client.auth.setSession({ access_token: userToken });
        return client;
    }
    return supabaseClient;
};

// Database query helpers
export const dbHelpers = {
    // Get hospitals by county/region
    async getHospitalsByRegion(countyId = null, subcountyId = null) {
        let query = supabaseAdmin
            .from('hospitals')
            .select(
                `
        *,
        county:counties(name, code),
        subcounty:subcounties(name, code)
      `
            )
            .eq('is_active', true);

        if (countyId) query = query.eq('county_id', countyId);
        if (subcountyId) query = query.eq('subcounty_id', subcountyId);

        const { data, error } = await query.order('name');
        return { data, error };
    },

    // Get current patient counts
    async getPatientCounts(hospitalId = null) {
        let query = supabaseAdmin
            .from('admissions')
            .select('hospital_id, status')
            .eq('status', 'active');

        if (hospitalId) query = query.eq('hospital_id', hospitalId);

        const { data, error } = await query;

        if (error) return { data: null, error };

        // Group by hospital
        const counts = data.reduce((acc, admission) => {
            acc[admission.hospital_id] = (acc[admission.hospital_id] || 0) + 1;
            return acc;
        }, {});

        return { data: counts, error: null };
    },

    // Get real-time vital signs
    async getLatestVitals(patientId = null, hospitalId = null, limit = 50) {
        let query = supabaseAdmin
            .from('vital_signs')
            .select(
                `
        *,
        patient:patients(patient_number, first_name, last_name),
        admission:admissions(ward, bed_number, hospital_id)
      `
            )
            .order('recorded_at', { ascending: false });

        if (patientId) query = query.eq('patient_id', patientId);
        if (limit) query = query.limit(limit);

        const { data, error } = await query;

        // Filter by hospital if specified
        if (hospitalId && data) {
            const filteredData = data.filter(
                (vital) => vital.admission?.hospital_id === hospitalId
            );
            return { data: filteredData, error };
        }

        return { data, error };
    },

    // Get active alerts
    async getActiveAlerts(hospitalId = null, severity = null) {
        let query = supabaseAdmin
            .from('alerts')
            .select(
                `
        *,
        patient:patients(patient_number, first_name, last_name),
        hospital:hospitals(name, code),
        triggered_by_user:neocare_users(full_name, role)
      `
            )
            .eq('is_resolved', false)
            .order('created_at', { ascending: false });

        if (hospitalId) query = query.eq('hospital_id', hospitalId);
        if (severity) query = query.eq('severity', severity);

        const { data, error } = await query;
        return { data, error };
    },

    // Get bed occupancy
    async getBedOccupancy(hospitalId = null) {
        let query = supabaseAdmin.from('beds').select(`
        *,
        hospital:hospitals(name, code),
        current_patient:patients(patient_number, first_name, last_name)
      `);

        if (hospitalId) query = query.eq('hospital_id', hospitalId);

        const { data, error } = await query;

        if (error) return { data: null, error };

        // Calculate occupancy statistics
        const stats = data.reduce((acc, bed) => {
            const hospitalId = bed.hospital_id;
            if (!acc[hospitalId]) {
                acc[hospitalId] = {
                    hospital: bed.hospital,
                    total: 0,
                    occupied: 0,
                    available: 0,
                    maintenance: 0,
                    occupancyRate: 0,
                };
            }

            acc[hospitalId].total++;
            acc[hospitalId][bed.status]++;

            return acc;
        }, {});

        // Calculate occupancy rates
        Object.values(stats).forEach((stat) => {
            stat.occupancyRate =
                stat.total > 0 ? Math.round((stat.occupied / stat.total) * 100) : 0;
        });

        return { data: stats, error: null };
    },

    // Get hospital metrics
    async getHospitalMetrics(hospitalId = null, days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let query = supabaseAdmin
            .from('hospital_metrics')
            .select(
                `
        *,
        hospital:hospitals(name, code)
      `
            )
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: false });

        if (hospitalId) query = query.eq('hospital_id', hospitalId);

        const { data, error } = await query;
        return { data, error };
    },

    // Record audit log
    async recordAuditLog(
        userId,
        action,
        resourceType,
        resourceId,
        oldValues,
        newValues,
        hospitalId
    ) {
        const { data, error } = await supabaseAdmin.from('audit_logs').insert({
            user_id: userId,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            old_values: oldValues,
            new_values: newValues,
            hospital_id: hospitalId,
            ip_address: '0.0.0.0', // Will be filled by API middleware
            user_agent: 'api',
        });

        return { data, error };
    },
};

// Real-time subscription helpers
export const realtimeHelpers = {
    // Subscribe to vital signs changes
    subscribeToVitals(callback, hospitalId = null) {
        let subscription = supabaseClient.channel('vital_signs_changes').on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'vital_signs',
            },
            callback
        );

        if (hospitalId) {
            // Filter by hospital if specified
            subscription = subscription.filter(`admission.hospital_id=eq.${hospitalId}`);
        }

        return subscription.subscribe();
    },

    // Subscribe to alerts
    subscribeToAlerts(callback, hospitalId = null) {
        let subscription = supabaseClient.channel('alerts_changes').on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'alerts',
            },
            callback
        );

        if (hospitalId) {
            subscription = subscription.filter(`hospital_id=eq.${hospitalId}`);
        }

        return subscription.subscribe();
    },

    // Subscribe to bed status changes
    subscribeToBeds(callback, hospitalId = null) {
        let subscription = supabaseClient.channel('beds_changes').on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'beds',
            },
            callback
        );

        if (hospitalId) {
            subscription = subscription.filter(`hospital_id=eq.${hospitalId}`);
        }

        return subscription.subscribe();
    },
};

export default supabaseAdmin;
