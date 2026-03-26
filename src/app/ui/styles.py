"""Custom CSS styles for the Streamlit application."""

CUSTOM_CSS = """
<style>
    /* Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden !important;}

    /* Main container */
    .main .block-container {
        padding-top: 1.5rem;
        padding-bottom: 1rem;
        max-width: 100%;
    }

    /* Sidebar */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
    }
    [data-testid="stSidebar"] [data-testid="stMarkdown"] p {
        color: #CBD5E1;
    }

    /* KPI Metric cards */
    [data-testid="stMetric"] {
        background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 16px 20px;
        transition: border-color 0.2s;
    }
    [data-testid="stMetric"]:hover {
        border-color: #7C3AED;
    }
    [data-testid="stMetric"] label {
        color: #94A3B8 !important;
        font-size: 0.8rem !important;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    [data-testid="stMetric"] [data-testid="stMetricValue"] {
        font-size: 1.8rem !important;
        font-weight: 700 !important;
        color: #E2E8F0 !important;
    }
    [data-testid="stMetric"] [data-testid="stMetricDelta"] {
        font-size: 0.85rem !important;
    }

    /* Chat messages */
    [data-testid="stChatMessage"] {
        border-radius: 12px;
        border: 1px solid #1E293B;
        margin-bottom: 8px;
        padding: 12px 16px;
    }

    /* Chat input */
    [data-testid="stChatInput"] textarea {
        border-radius: 12px !important;
        border-color: #334155 !important;
        background: #1E293B !important;
    }
    [data-testid="stChatInput"] textarea:focus {
        border-color: #7C3AED !important;
        box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2) !important;
    }

    /* Buttons */
    .stButton > button {
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.2s;
        border: 1px solid #334155;
        background: #1E293B;
        color: #E2E8F0;
    }
    .stButton > button:hover {
        border-color: #7C3AED;
        background: #252f3f;
    }

    /* Expanders */
    [data-testid="stExpander"] {
        border: 1px solid #1E293B;
        border-radius: 8px;
        background: rgba(30, 41, 59, 0.3);
    }

    /* Dataframe */
    [data-testid="stDataFrame"] {
        border-radius: 8px;
        overflow: hidden;
    }

    /* Divider */
    hr {
        border-color: #1E293B !important;
    }

    /* Tabs */
    .stTabs [data-baseweb="tab-list"] {
        gap: 4px;
        background: transparent;
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px;
        padding: 8px 16px;
        color: #94A3B8;
    }
    .stTabs [aria-selected="true"] {
        background: #1E293B;
        color: #E2E8F0;
    }

    /* Custom scrollbar */
    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    ::-webkit-scrollbar-track {
        background: transparent;
    }
    ::-webkit-scrollbar-thumb {
        background: #475569;
        border-radius: 3px;
    }

    /* Suggestion chips container */
    .suggestion-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 12px 0;
    }

    /* Toast-like status bar */
    .query-meta {
        display: flex;
        gap: 16px;
        color: #64748B;
        font-size: 0.75rem;
        margin-top: 8px;
    }
    .query-meta span {
        display: flex;
        align-items: center;
        gap: 4px;
    }
</style>
"""
