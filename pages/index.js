// NeoCare360 Production API - Homepage
// Serves as landing page and redirects to frontend

export default function HomePage() {
    return (
        <div
            style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                maxWidth: '800px',
                margin: '0 auto',
                padding: '40px 20px',
                lineHeight: '1.6',
                color: '#333',
            }}
        >
            <div
                style={{
                    textAlign: 'center',
                    marginBottom: '40px',
                }}
            >
                <h1
                    style={{
                        fontSize: '2.5rem',
                        color: '#2563eb',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                    }}
                >
                    🏥 NeoCare360
                </h1>
                <p
                    style={{
                        fontSize: '1.2rem',
                        color: '#666',
                        margin: '0',
                    }}
                >
                    Kenya Clinical Intelligence Hub - Production API
                </p>
            </div>

            <div
                style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '24px',
                    marginBottom: '32px',
                }}
            >
                <h2
                    style={{
                        fontSize: '1.3rem',
                        marginBottom: '16px',
                        color: '#1e293b',
                    }}
                >
                    🎯 API Status: Operational
                </h2>
                <p style={{ margin: '0 0 16px 0' }}>
                    The NeoCare360 Production API is running successfully and ready to serve
                    healthcare data.
                </p>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginTop: '20px',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '16px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                        }}
                    >
                        <strong style={{ color: '#059669' }}>✅ Database</strong>
                        <br />
                        Connected
                    </div>
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '16px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                        }}
                    >
                        <strong style={{ color: '#059669' }}>✅ Authentication</strong>
                        <br />
                        Secured
                    </div>
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '16px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                        }}
                    >
                        <strong style={{ color: '#059669' }}>✅ Rate Limiting</strong>
                        <br />
                        Active
                    </div>
                </div>
            </div>

            <div
                style={{
                    backgroundColor: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px',
                    padding: '24px',
                    marginBottom: '32px',
                }}
            >
                <h3
                    style={{
                        fontSize: '1.2rem',
                        marginBottom: '12px',
                        color: '#92400e',
                    }}
                >
                    🚀 Looking for the NeoCare360 Dashboard?
                </h3>
                <p style={{ margin: '0 0 16px 0', color: '#92400e' }}>
                    This is the backend API. To access the full NeoCare360 Clinical Intelligence
                    Dashboard, you'll need to deploy the frontend application separately.
                </p>
                <a
                    href="/api"
                    style={{
                        display: 'inline-block',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        padding: '10px 20px',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        marginRight: '12px',
                        marginBottom: '8px',
                    }}
                >
                    📋 View API Documentation
                </a>
                <a
                    href="https://github.com/your-org/neocare360-frontend"
                    style={{
                        display: 'inline-block',
                        backgroundColor: '#059669',
                        color: 'white',
                        padding: '10px 20px',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        marginBottom: '8px',
                    }}
                >
                    🎨 Deploy Frontend
                </a>
            </div>

            <div
                style={{
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '24px',
                }}
            >
                <h3
                    style={{
                        fontSize: '1.1rem',
                        marginBottom: '16px',
                        color: '#334155',
                    }}
                >
                    🔗 Quick API Access
                </h3>
                <div style={{ fontSize: '0.9rem' }}>
                    <div style={{ marginBottom: '12px' }}>
                        <code
                            style={{
                                backgroundColor: '#e2e8f0',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                marginRight: '8px',
                            }}
                        >
                            GET /api/v1/overview/dashboard
                        </code>
                        <span style={{ color: '#64748b' }}>Dashboard Overview</span>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <code
                            style={{
                                backgroundColor: '#e2e8f0',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                marginRight: '8px',
                            }}
                        >
                            GET /api/v1/patients/monitoring
                        </code>
                        <span style={{ color: '#64748b' }}>Patient Monitoring</span>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <code
                            style={{
                                backgroundColor: '#e2e8f0',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                marginRight: '8px',
                            }}
                        >
                            GET /api/v1/icu/command-center
                        </code>
                        <span style={{ color: '#64748b' }}>ICU Command Center</span>
                    </div>
                </div>
            </div>

            <footer
                style={{
                    textAlign: 'center',
                    marginTop: '40px',
                    paddingTop: '20px',
                    borderTop: '1px solid #e2e8f0',
                    color: '#64748b',
                    fontSize: '0.9rem',
                }}
            >
                <p>
                    NeoCare360 - Transforming Healthcare Intelligence in Kenya
                    <br />
                    🌍 Powered by Advanced Clinical Analytics & Real-time Monitoring
                </p>
            </footer>
        </div>
    );
}
