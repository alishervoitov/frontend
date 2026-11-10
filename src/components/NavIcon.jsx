// Menyu ikonkalari (chiziqli, 20x20, rangi matn rangidan olinadi)
const PATHS = {
    queue: "M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z M10 7v12",
    access: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    consent: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4",
    key: "M7.5 15.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M11.5 11.5H21 M18 11.5v3 M15 11.5v2.5",
    lab: "M9 3h6 M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3 M7.5 15h9",
    list: "M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01",
    registry: "M9 3h6a1 1 0 0 1 1 1v2H8V4a1 1 0 0 1 1-1z M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 12h6 M9 16h4",
    stats: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
    patients: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1 M9 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M22 19v-1a4 4 0 0 0-3-3.9 M16 4.1a3.5 3.5 0 0 1 0 6.8",
    users: "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4 21v-1a6 6 0 0 1 9-5.2 M18 15v6 M15 18h6",
    audit: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M14 3v6h6 M9 15l2 2 4-4",
    alerts: "M12 3l9 16H3z M12 10v4 M12 17h.01",
    anonymize: "M3 3l18 18 M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.6 3.5 M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.4-1.6 M9.9 9.9a3 3 0 0 0 4.2 4.2",
    profile: "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4 21a8 8 0 0 1 16 0",
    devices: "M3 5h13v9H3z M7 18h5 M9.5 14v4 M18 9h3v10h-3z",
    logout: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3 M10 16l-4-4 4-4 M6 12h10",
    menu: "M4 7h16 M4 12h16 M4 17h16",
    close: "M6 6l12 12 M18 6L6 18",
    settings: "M4 6h9 M17 6h3 M15 4v4 M4 12h3 M11 12h9 M9 10v4 M4 18h11 M19 18h1 M17 16v4",
};

export default function NavIcon({ name, size = 20 }) {
    return (
        <svg className="nav-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={PATHS[name] || PATHS.list} />
        </svg>
    );
}
