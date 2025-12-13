-- Seed initial source registry for DC Internet Listener
-- Based on official DC government accounts, WMATA, ANCs, and community sources

-- Executive Office of the Mayor
INSERT INTO sources (slug, name, source_type, platform, handle, format, refresh_rate_minutes, is_active, categories) VALUES
('mayor_bowser', 'Executive Office of the Mayor', 'OFFICIAL_SOCIAL', 'twitter', '@MayorBowser', 'json', 5, true, ARRAY['policy', 'announcements']),
('mayor_calendar', 'Mayor Public Calendar', 'MAYOR_CALENDAR', 'rss', null, 'rss', 60, true, ARRAY['events', 'policy']);

-- Mayor Community Outreach Offices
INSERT INTO sources (slug, name, source_type, platform, handle, format, refresh_rate_minutes, is_active, categories) VALUES
('comm_aff_dc', 'Mayor Office of Community Affairs', 'OFFICIAL_SOCIAL', 'twitter', '@CommAffDC', 'json', 10, true, ARRAY['community', 'events']),
('dc_mocrs', 'Community Relations & Services', 'OFFICIAL_SOCIAL', 'twitter', '@DCMOCRS', 'json', 10, true, ARRAY['community', 'services']);

-- DC Government Agencies
INSERT INTO sources (slug, name, source_type, platform, handle, format, refresh_rate_minutes, is_active, categories) VALUES
('dc_police', 'Metropolitan Police Department', 'OFFICIAL_SOCIAL', 'twitter', '@DCPoliceDept', 'json', 5, true, ARRAY['safety', 'alerts']),
('ddot_dc', 'District Department of Transportation', 'OFFICIAL_SOCIAL', 'twitter', '@ddotdc', 'json', 5, true, ARRAY['transportation', 'alerts']),
('dc_dpw', 'Department of Public Works', 'OFFICIAL_SOCIAL', 'twitter', '@DCDPW', 'json', 15, true, ARRAY['infrastructure', 'services']),
('octo_dc', 'Office of the Chief Technology Officer', 'OFFICIAL_SOCIAL', 'twitter', '@octodc', 'json', 30, true, ARRAY['technology', 'services']),
('dfhv_dc', 'Department of For-Hire Vehicles', 'OFFICIAL_SOCIAL', 'twitter', '@dfhv_dc', 'json', 30, true, ARRAY['transportation']);

-- WMATA (Metro) feeds
INSERT INTO sources (slug, name, source_type, platform, handle, format, refresh_rate_minutes, is_active, categories) VALUES
('metrorail_info', 'WMATA Metrorail Info', 'METRO_SOCIAL', 'twitter', '@metrorailinfo', 'json', 2, true, ARRAY['transportation', 'alerts']),
('metrobus_info', 'WMATA Metrobus Info', 'METRO_SOCIAL', 'twitter', '@metrobusinfo', 'json', 2, true, ARRAY['transportation', 'alerts']);

-- ANC sources
INSERT INTO sources (slug, name, source_type, platform, url, format, refresh_rate_minutes, is_active, ward_scope, categories) VALUES
('oanc_calendar', 'OANC ANC Meeting Calendar', 'OANC_CALENDAR', 'web', 'https://anc.dc.gov', 'html', 1440, true, ARRAY[]::INT[], ARRAY['meetings', 'civic']),
('anc_resolutions', 'ANC Resolutions Portal', 'ANC_RESOLUTIONS', 'web', 'https://anc.dc.gov/page/anc-resolutions', 'html', 1440, true, ARRAY[]::INT[], ARRAY['civic', 'policy']);

-- Sample ANC sites with RSS/ICS where available
INSERT INTO sources (slug, name, source_type, platform, url, format, refresh_rate_minutes, is_active, ward_scope, categories) VALUES
('anc_4b_agenda', 'ANC 4B Agendas Feed', 'ANC_SITE', 'rss', 'https://anc4b.org/feed/', 'rss', 1440, true, ARRAY[4], ARRAY['meetings', 'civic']),
('anc_4b_calendar', 'ANC 4B Meeting Calendar', 'ANC_SITE', 'ical', 'https://anc4b.org/calendar/ical/', 'ics', 1440, true, ARRAY[4], ARRAY['meetings', 'civic']);

-- DC.gov RSS feeds
INSERT INTO sources (slug, name, source_type, platform, url, format, refresh_rate_minutes, is_active, categories) VALUES
('dc_gov_rss', 'DC.gov News Feed', 'DC_RSS', 'rss', 'https://dc.gov/feed', 'rss', 60, true, ARRAY['news', 'announcements']);

-- Reddit sources
INSERT INTO sources (slug, name, source_type, platform, handle, format, refresh_rate_minutes, is_active, categories) VALUES
('reddit_dc', 'r/washingtondc Subreddit', 'REDDIT', 'reddit', 'washingtondc', 'json', 10, true, ARRAY['community', 'discussion']);

-- Email listservs (placeholder - requires IMAP configuration)
INSERT INTO sources (slug, name, source_type, platform, format, refresh_rate_minutes, is_active, categories) VALUES
('capitol_hill_listserv', 'Capitol Hill Neighborhood Listserv', 'EMAIL_LIST', 'email', 'email', 30, false, ARRAY['community', 'neighborhood']);

-- Note: Additional sources should be added as discovered
-- Each ANC (there are 46 ANCs across 8 wards) should have entries if they publish feeds
-- Individual councilmember social accounts should be added with ward_scope set appropriately
