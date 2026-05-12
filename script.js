/* ============================================================ */
/*                     AGUILA: JAVASCRIPT                      */
/* ============================================================ */

const SUPABASE_URL = 'https://mklthizjwvvnatndcree.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_H0g0m-DD15fbVFJ5TMPb4g_9U7IKEyu';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function clearPlaceholderRow(tbody, colSpan) {
    if (tbody.rows[0] && tbody.rows[0].cells[0].colSpan === colSpan) {
        tbody.innerHTML = '';
    }
}

function formatAddress(parts) {
    var cleaned = parts.map(function(part) {
        return part ? part.trim() : '';
    }).filter(function(part) {
        return part.length > 0;
    });
    return cleaned.length ? cleaned.join(', ') : '—';
}

function getInputValue(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
}

function renderMarketRow(row) {
    var detailsBody = document.getElementById('market-details-body');
    var complianceBody = document.getElementById('market-compliance-body');
    clearPlaceholderRow(detailsBody, 9);
    clearPlaceholderRow(complianceBody, 5);

    var detailsRow = document.createElement('tr');
    var complianceRow = document.createElement('tr');
    detailsRow.innerHTML =
        '<td>' + row.fullname + '</td><td>' + row.address + '</td>' +
        '<td>' + row.contact + '</td><td>' + row.businessName + '</td>' +
        '<td>' + row.stall + '</td><td>' + row.goods + '</td>' +
        '<td>' + row.permit + '</td><td>' + row.idType + '</td>' +
        '<td>' + row.idNumber + '</td>';
    complianceRow.innerHTML =
        '<td>' + row.fullname + '</td><td>' + row.sanitary + '</td>' +
        '<td>' + row.cleanliness + '</td><td>' + row.wasteSeg + '</td>' +
        '<td>' + row.healthCert + '</td>';
    if (row.sanitary === 'Poor' || row.wasteSeg === 'No') {
        complianceRow.classList.add('non-compliant');
    }
    detailsBody.appendChild(detailsRow);
    complianceBody.appendChild(complianceRow);
}

function renderDisasterRow(row) {
    var householdBody = document.getElementById('disaster-household-body');
    var preparednessBody = document.getElementById('disaster-preparedness-body');
    clearPlaceholderRow(householdBody, 3);
    clearPlaceholderRow(preparednessBody, 10);
    var householdRow = document.createElement('tr');
    var preparednessRow = document.createElement('tr');
    householdRow.innerHTML =
        '<td>' + row.familyName + '</td><td>' + row.address + '</td>' +
        '<td>' + row.members + '</td>';
    preparednessRow.innerHTML =
        '<td>' + row.familyName + '</td><td>' + row.risk + '</td>' +
        '<td>' + row.pastDisaster + '</td><td>' + row.experience + '</td>' +
        '<td>' + row.evacPoint + '</td><td>' + row.evacPlan + '</td>' +
        '<td>' + row.planDetails + '</td><td>' + row.kit + '</td>' +
        '<td>' + row.kitItems + '</td><td>' + row.kitNeed + '</td>';
    if (row.kit === 'No') preparednessRow.classList.add('non-compliant');
    householdBody.appendChild(householdRow);
    preparednessBody.appendChild(preparednessRow);
}

async function loadMarketRecords() {
    var result = await supabaseClient
        .from('market_submissions')
        .select('fullname,address,contact,business_name,stall,goods,permit,id_type,id_number,cleanliness,sanitary,waste_seg,health_cert,created_at')
        .order('created_at', { ascending: true });
    if (result.error) {
        console.warn('Failed to load market records:', result.error.message);
        return;
    }
    result.data.forEach(function(item) {
        renderMarketRow({
            fullname: item.fullname || '—',
            address: item.address || '—',
            contact: item.contact || '—',
            businessName: item.business_name || '—',
            stall: item.stall || '—',
            goods: item.goods || '—',
            permit: item.permit || '—',
            idType: item.id_type || '—',
            idNumber: item.id_number || '—',
            sanitary: item.sanitary || '—',
            cleanliness: item.cleanliness || '—',
            wasteSeg: item.waste_seg || '—',
            healthCert: item.health_cert || '—'
        });
    });
}

async function loadDisasterRecords() {
    var result = await supabaseClient
        .from('disaster_submissions')
        .select('family_name,address,members,risk,dexp,experience,epoint,eplan_answer,plan_items,kit,kit_items,kit_need,created_at')
        .order('created_at', { ascending: true });
    if (result.error) {
        console.warn('Failed to load disaster records:', result.error.message);
        return;
    }
    result.data.forEach(function(item) {
        renderDisasterRow({
            familyName: item.family_name || '—',
            address: item.address || '—',
            members: item.members || '—',
            risk: item.risk || '—',
            pastDisaster: item.dexp || '—',
            experience: item.experience || 'N/A',
            evacPoint: item.epoint || '—',
            evacPlan: item.eplan_answer || '—',
            planDetails: item.plan_items || '—',
            kit: item.kit || '—',
            kitItems: item.kit_items || '—',
            kitNeed: item.kit_need || '—'
        });
    });
}

async function loadLandingStats() {
    var marketCountEl = document.getElementById('market-count');
    var disasterCountEl = document.getElementById('disaster-count');
    var totalCountEl = document.getElementById('total-count');
    var lastUpdatedEl = document.getElementById('last-updated');
    var marketReportCountEl = document.getElementById('market-report-count');
    var marketAlertCountEl = document.getElementById('market-alert-count');
    var marketGoodCountEl = document.getElementById('market-good-count');
    var marketWasteYesEl = document.getElementById('market-waste-yes');
    var marketHealthValidEl = document.getElementById('market-health-valid');
    var disasterReportCountEl = document.getElementById('disaster-report-count');
    var disasterAlertCountEl = document.getElementById('disaster-alert-count');
    var disasterHighRiskEl = document.getElementById('disaster-high-risk');
    var disasterEvacPlanEl = document.getElementById('disaster-evac-plan');
    var disasterKitYesEl = document.getElementById('disaster-kit-yes');
    if (!marketCountEl || !disasterCountEl || !totalCountEl || !lastUpdatedEl) return;

    var marketResult = await supabaseClient
        .from('market_submissions')
        .select('*', { count: 'exact', head: true });
    if (!marketResult.error && typeof marketResult.count === 'number') {
        marketCountEl.textContent = String(marketResult.count);
    }

    var disasterResult = await supabaseClient
        .from('disaster_submissions')
        .select('*', { count: 'exact', head: true });
    if (!disasterResult.error && typeof disasterResult.count === 'number') {
        disasterCountEl.textContent = String(disasterResult.count);
    }

    if (marketReportCountEl) {
        marketReportCountEl.textContent = marketResult && typeof marketResult.count === 'number'
            ? String(marketResult.count)
            : '0';
    }
    if (disasterReportCountEl) {
        disasterReportCountEl.textContent = disasterResult && typeof disasterResult.count === 'number'
            ? String(disasterResult.count)
            : '0';
    }

    if (marketAlertCountEl) {
        var alertResult = await supabaseClient
            .from('market_submissions')
            .select('*', { count: 'exact', head: true })
            .or('sanitary.eq.Poor,waste_seg.eq.No');
        marketAlertCountEl.textContent = !alertResult.error && typeof alertResult.count === 'number'
            ? String(alertResult.count)
            : '0';
    }

    if (marketGoodCountEl) {
        var goodResult = await supabaseClient
            .from('market_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('sanitary', 'Good');
        marketGoodCountEl.textContent = !goodResult.error && typeof goodResult.count === 'number'
            ? String(goodResult.count)
            : '0';
    }

    if (marketWasteYesEl) {
        var wasteResult = await supabaseClient
            .from('market_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('waste_seg', 'Yes');
        marketWasteYesEl.textContent = !wasteResult.error && typeof wasteResult.count === 'number'
            ? String(wasteResult.count)
            : '0';
    }

    if (marketHealthValidEl) {
        var healthResult = await supabaseClient
            .from('market_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('health_cert', 'Valid');
        marketHealthValidEl.textContent = !healthResult.error && typeof healthResult.count === 'number'
            ? String(healthResult.count)
            : '0';
    }

    if (disasterAlertCountEl) {
        var kitResult = await supabaseClient
            .from('disaster_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('kit', 'No');
        disasterAlertCountEl.textContent = !kitResult.error && typeof kitResult.count === 'number'
            ? String(kitResult.count)
            : '0';
    }

    if (disasterHighRiskEl) {
        var highRiskResult = await supabaseClient
            .from('disaster_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('risk', 'High');
        disasterHighRiskEl.textContent = !highRiskResult.error && typeof highRiskResult.count === 'number'
            ? String(highRiskResult.count)
            : '0';
    }

    if (disasterEvacPlanEl) {
        var evacPlanResult = await supabaseClient
            .from('disaster_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('eplan_answer', 'Yes');
        disasterEvacPlanEl.textContent = !evacPlanResult.error && typeof evacPlanResult.count === 'number'
            ? String(evacPlanResult.count)
            : '0';
    }

    if (disasterKitYesEl) {
        var kitYesResult = await supabaseClient
            .from('disaster_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('kit', 'Yes');
        disasterKitYesEl.textContent = !kitYesResult.error && typeof kitYesResult.count === 'number'
            ? String(kitYesResult.count)
            : '0';
    }

    var totalCount = (marketResult && marketResult.count ? marketResult.count : 0) +
        (disasterResult && disasterResult.count ? disasterResult.count : 0);
    totalCountEl.textContent = String(totalCount);

    var latestMarket = await supabaseClient
        .from('market_submissions')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    var latestDisaster = await supabaseClient
        .from('disaster_submissions')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    var latest = null;
    if (latestMarket && latestMarket.data && latestMarket.data.created_at) {
        latest = latestMarket.data.created_at;
    }
    if (latestDisaster && latestDisaster.data && latestDisaster.data.created_at) {
        if (!latest || new Date(latestDisaster.data.created_at) > new Date(latest)) {
            latest = latestDisaster.data.created_at;
        }
    }
    if (latest) {
        lastUpdatedEl.textContent = new Date(latest).toLocaleString();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadMarketRecords();
    loadDisasterRecords();
    loadLandingStats();
    document.getElementById('bg-landing').style.display = 'block';
    document.getElementById('bg-market').style.display = 'none';
    document.getElementById('bg-disaster').style.display = 'none';
    var heroTitle = document.getElementById('hero-title');
    var heroDescription = document.getElementById('hero-description');
    if (heroTitle && heroDescription) {
        heroTitle.textContent = 'Philippines-Wide Registration & Preparedness';
        heroDescription.textContent = 'Select a form to begin capturing vendor records or disaster readiness data across the country.';
    }
    var heroMarketBtn = document.getElementById('hero-market-btn');
    var heroDisasterBtn = document.getElementById('hero-disaster-btn');
    var heroHomeBtn = document.getElementById('hero-home-btn');
    var devTeam = document.getElementById('dev-team');
    var landingFooter = document.getElementById('landing-footer');
    if (heroMarketBtn) heroMarketBtn.classList.remove('is-active');
    if (heroDisasterBtn) heroDisasterBtn.classList.remove('is-active');
    if (heroHomeBtn) {
        heroHomeBtn.classList.remove('is-active');
        heroHomeBtn.classList.add('is-hidden');
    }
    document.body.classList.remove('theme-market', 'theme-disaster', 'theme-landing');
    document.body.classList.add('theme-landing');
    if (devTeam) devTeam.style.display = 'block';
    if (landingFooter) landingFooter.style.display = 'block';

    var idTypeInput = document.getElementById('idType');
    var idNumberInput = document.getElementById('idNumber');
    function syncIdNumberState() {
        if (!idTypeInput || !idNumberInput) return;
        var hasType = idTypeInput.value.trim().length > 0;
        idNumberInput.disabled = !hasType;
        if (!hasType) idNumberInput.value = '';
    }
    if (idTypeInput) {
        idTypeInput.addEventListener('input', syncIdNumberState);
    }
    syncIdNumberState();

    var marketTopBtn = document.getElementById('market-top-btn');
    var marketClearBtn = document.getElementById('market-clear-btn');
    var marketReportBtn = document.getElementById('market-report-btn');
    var disasterTopBtn = document.getElementById('disaster-top-btn');
    var disasterClearBtn = document.getElementById('disaster-clear-btn');
    var disasterReportBtn = document.getElementById('disaster-report-btn');
    var marketFormWrap = document.getElementById('market-form-wrap');
    var marketReports = document.getElementById('market-reports');
    var disasterFormWrap = document.getElementById('disaster-form-wrap');
    var disasterReports = document.getElementById('disaster-reports');
    var disasterMap = document.getElementById('disaster-map');
    var disasterMapBtn = document.getElementById('disaster-map-btn');
    var marketFormBtn = document.getElementById('market-form-btn');
    var disasterFormBtn = document.getElementById('disaster-form-btn');
    if (marketTopBtn) {
        marketTopBtn.addEventListener('click', function() {
            var target = document.querySelector('.hero');
            if (target) {
                var top = target.getBoundingClientRect().top + window.pageYOffset - 16;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    }
    if (disasterTopBtn) {
        disasterTopBtn.addEventListener('click', function() {
            var target = document.querySelector('.hero');
            if (target) {
                var top = target.getBoundingClientRect().top + window.pageYOffset - 16;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    }
    if (marketReportBtn) {
        marketReportBtn.addEventListener('click', function() {
            var showingReports = marketReports && marketReports.style.display === 'block';
            if (marketFormWrap) marketFormWrap.style.display = showingReports ? 'block' : 'none';
            if (marketReports) marketReports.style.display = showingReports ? 'none' : 'block';
            var target = showingReports ? marketFormWrap : marketReports;
            if (target) {
                var top = target.getBoundingClientRect().top + window.pageYOffset - 8;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    }
    if (disasterReportBtn) {
        disasterReportBtn.addEventListener('click', function() {
            var showingReports = disasterReports && disasterReports.style.display === 'block';
            if (disasterFormWrap) disasterFormWrap.style.display = showingReports ? 'block' : 'none';
            if (disasterReports) disasterReports.style.display = showingReports ? 'none' : 'block';
            if (disasterMap) disasterMap.style.display = 'none';
            var target = showingReports ? disasterFormWrap : disasterReports;
            if (target) {
                var top = target.getBoundingClientRect().top + window.pageYOffset - 8;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    }
    if (disasterMapBtn) {
        disasterMapBtn.addEventListener('click', function() {
            var showingMap = disasterMap && disasterMap.style.display === 'block';
            if (disasterFormWrap) disasterFormWrap.style.display = showingMap ? 'block' : 'none';
            if (disasterReports) disasterReports.style.display = 'none';
            if (disasterMap) disasterMap.style.display = showingMap ? 'none' : 'block';
            var target = showingMap ? disasterFormWrap : disasterMap;
            if (target) {
                var top = target.getBoundingClientRect().top + window.pageYOffset - 8;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    }
    if (marketFormBtn) {
        marketFormBtn.addEventListener('click', function() {
            if (marketFormWrap) marketFormWrap.style.display = 'block';
            if (marketReports) marketReports.style.display = 'none';
            if (marketFormWrap) {
                var top = marketFormWrap.getBoundingClientRect().top + window.pageYOffset - 8;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    }
    if (disasterFormBtn) {
        disasterFormBtn.addEventListener('click', function() {
            if (disasterFormWrap) disasterFormWrap.style.display = 'block';
            if (disasterReports) disasterReports.style.display = 'none';
            if (disasterMap) disasterMap.style.display = 'none';
            if (disasterFormWrap) {
                var top = disasterFormWrap.getBoundingClientRect().top + window.pageYOffset - 8;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    }
    if (marketClearBtn) {
        marketClearBtn.addEventListener('click', function() {
            var form = document.getElementById('market-form');
            if (form) form.reset();
            var compliance = document.getElementById('compliance-fieldset');
            if (compliance) compliance.classList.remove('warning-highlight');
            syncIdNumberState();
        });
    }
    if (disasterClearBtn) {
        disasterClearBtn.addEventListener('click', function() {
            var form = document.getElementById('disaster-form');
            if (form) form.reset();
            var section = document.getElementById('mayo-section');
            if (section) {
                section.style.border = '';
                section.style.backgroundColor = 'rgba(255,255,255,0.92)';
            }
        });
    }
});

/* --- Switch pages via hero buttons --- */
function showPage(page) {
    var hero = document.querySelector('.hero');
    if (hero) hero.classList.add('compact');
    var marketPage = document.getElementById('market-page');
    var disasterPage = document.getElementById('disaster-page');
    if (marketPage) marketPage.style.display = 'none';
    if (disasterPage) disasterPage.style.display = 'none';
    var targetPage = document.getElementById(page + '-page');
    if (targetPage) {
        targetPage.style.display = 'block';
        requestAnimationFrame(function() {
            var top = targetPage.getBoundingClientRect().top + window.pageYOffset - 8;
            window.scrollTo({ top: top, behavior: 'smooth' });
        });
    }

    var heroTitle = document.getElementById('hero-title');
    var heroDescription = document.getElementById('hero-description');
    var heroMarketBtn = document.getElementById('hero-market-btn');
    var heroDisasterBtn = document.getElementById('hero-disaster-btn');
    var heroHomeBtn = document.getElementById('hero-home-btn');
    var devTeam = document.getElementById('dev-team');
    var landingFooter = document.getElementById('landing-footer');
    document.body.classList.remove('theme-market', 'theme-disaster', 'theme-landing');
    if (heroTitle && heroDescription) {
        if (page === 'market') {
            heroTitle.textContent = 'Market Vendor Registration Form';
            heroDescription.textContent = 'Register public market vendors with complete identification, compliance, and health certification details.';
            if (heroMarketBtn) heroMarketBtn.classList.add('is-active');
            if (heroDisasterBtn) heroDisasterBtn.classList.remove('is-active');
            if (heroHomeBtn) {
                heroHomeBtn.classList.remove('is-active');
                heroHomeBtn.classList.remove('is-hidden');
            }
            document.body.classList.add('theme-market');
        } else if (page === 'disaster') {
            heroTitle.textContent = 'Disaster Preparedness Survey';
            heroDescription.textContent = 'Capture household risk awareness, evacuation planning, and emergency kit readiness across communities.';
            if (heroDisasterBtn) heroDisasterBtn.classList.add('is-active');
            if (heroMarketBtn) heroMarketBtn.classList.remove('is-active');
            if (heroHomeBtn) {
                heroHomeBtn.classList.remove('is-active');
                heroHomeBtn.classList.remove('is-hidden');
            }
            document.body.classList.add('theme-disaster');
        } else if (page === 'home') {
            heroTitle.textContent = 'Philippines-Wide Registration & Preparedness';
            heroDescription.textContent = 'Select a form to begin capturing vendor records or disaster readiness data across the country.';
            if (heroMarketBtn) heroMarketBtn.classList.remove('is-active');
            if (heroDisasterBtn) heroDisasterBtn.classList.remove('is-active');
            if (heroHomeBtn) {
                heroHomeBtn.classList.add('is-active');
                heroHomeBtn.classList.add('is-hidden');
            }
            document.body.classList.add('theme-landing');
        }
    }

    if (devTeam) devTeam.style.display = page === 'home' ? 'block' : 'none';
    if (landingFooter) landingFooter.style.display = page === 'home' ? 'block' : 'none';

    document.getElementById('bg-landing').style.display = page === 'home' ? 'block' : 'none';
    document.getElementById('bg-market').style.display = page === 'market' ? 'block' : 'none';
    document.getElementById('bg-disaster').style.display = page === 'disaster' ? 'block' : 'none';

    if (page === 'home') {
        if (hero) hero.classList.remove('compact');
        document.querySelector('.hero').scrollIntoView({ behavior: 'smooth', block: 'start' });
        loadLandingStats();
    }

    if (page === 'market') {
        var marketFormWrap = document.getElementById('market-form-wrap');
        var marketReports = document.getElementById('market-reports');
        if (marketFormWrap) marketFormWrap.style.display = 'block';
        if (marketReports) marketReports.style.display = 'none';
    }
    if (page === 'disaster') {
        var disasterFormWrap = document.getElementById('disaster-form-wrap');
        var disasterReports = document.getElementById('disaster-reports');
        var disasterMap = document.getElementById('disaster-map');
        if (disasterFormWrap) disasterFormWrap.style.display = 'block';
        if (disasterReports) disasterReports.style.display = 'none';
        if (disasterMap) disasterMap.style.display = 'none';
    }
}

/* --- Warning highlight: Poor sanitary practice --- */
document.querySelectorAll('input[name="sanitary"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
        var fieldset = document.getElementById('compliance-fieldset');
        fieldset.classList.toggle('warning-highlight', this.value === 'Poor');
    });
});

/* --- Market form: submit to table --- */
document.getElementById('market-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    var sanitary = document.querySelector('input[name="sanitary"]:checked');
    var wasteSeg = document.querySelector('input[name="wasteSegregation"]:checked');
    var cleanlinessItems = [];
    document.querySelectorAll('input[name="cleanliness[]"]:checked').forEach(function(cb) { cleanlinessItems.push(cb.value); });
    var row = {
        fullname:     document.getElementById('fullname').value || '—',
        address:      formatAddress([
            getInputValue('addressStreet'),
            getInputValue('addressSubdivision'),
            getInputValue('addressBarangay'),
            getInputValue('addressCity'),
            getInputValue('addressProvince'),
            getInputValue('addressRegion')
        ]),
        contact:      document.getElementById('contact').value || '—',
        businessName: document.getElementById('businessName').value || '—',
        stall:        document.getElementById('stall').value || '—',
        goods:        document.getElementById('goods').value || '—',
        permit:       document.getElementById('permit').value || '—',
        idType:       document.getElementById('idType').value || '—',
        idNumber:     document.getElementById('idNumber').value || '—',
        sanitary:     sanitary ? sanitary.value : '—',
        cleanliness:  cleanlinessItems.length > 0 ? cleanlinessItems.join(', ') : '—',
        wasteSeg:     wasteSeg ? wasteSeg.value : '—',
        healthCert:   document.getElementById('healthStatus').value
    };
    var result = await supabaseClient
        .from('market_submissions')
        .insert([{ 
            fullname: row.fullname,
            address: row.address,
            contact: row.contact,
            business_name: row.businessName,
            stall: row.stall,
            goods: row.goods,
            permit: row.permit,
            id_type: row.idType,
            id_number: row.idNumber,
            sanitary: row.sanitary,
            cleanliness: row.cleanliness,
            waste_seg: row.wasteSeg,
            health_cert: row.healthCert
        }])
        .select()
        .single();
    if (result.error) {
        console.error('Market submit failed:', result.error.message);
        alert('Failed to save vendor record. Please try again.');
        return;
    }
    renderMarketRow(row);
    this.reset();
    document.getElementById('compliance-fieldset').classList.remove('warning-highlight');
    loadLandingStats();
});

/* --- Warning highlight: No emergency kit --- */
document.querySelectorAll('input[name="kit_ready"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
        var section = document.getElementById('mayo-section');
        if (this.value === 'No') {
            section.style.border = '2px solid #e53935';
            section.style.backgroundColor = 'rgba(255,229,229,0.95)';
        } else {
            section.style.border = '';
            section.style.backgroundColor = 'rgba(255,255,255,0.92)';
        }
    });
});

/* --- Disaster form: submit to table --- */
document.getElementById('disaster-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    var pastDisaster = document.querySelector('input[name="dexp"]:checked');
    var evacPoint = document.querySelector('input[name="epoint"]:checked');
    var evacPlan = document.querySelector('input[name="eplan"]:checked');
    var kitReady = document.querySelector('input[name="kit_ready"]:checked');
    var kitNeed = document.querySelector('input[name="kit_need"]:checked');
    var plans = [];
    document.querySelectorAll('input[name="plan"]:checked').forEach(function(cb) { plans.push(cb.value); });
    var kitItems = [];
    document.querySelectorAll('input[name="kit_items"]:checked').forEach(function(cb) { kitItems.push(cb.value); });
    var row = {
        familyName: document.getElementById('family-name').value || '—',
        address:    formatAddress([
            getInputValue('d-address-street'),
            getInputValue('d-address-subdivision'),
            getInputValue('d-address-barangay'),
            getInputValue('d-address-city'),
            getInputValue('d-address-province'),
            getInputValue('d-address-region')
        ]),
        members:    document.getElementById('family-members').value || '—',
        risk:       document.getElementById('risk').value,
        pastDisaster: pastDisaster ? pastDisaster.value : '—',
        kit:        kitReady ? kitReady.value : '—',
        evacPoint:  evacPoint ? evacPoint.value : '—',
        evacPlan:   evacPlan ? evacPlan.value : '—',
        planDetails: plans.length > 0 ? plans.join(', ') : '—',
        kitItems:   kitItems.length > 0 ? kitItems.join(', ') : '—',
        kitNeed:    kitNeed ? kitNeed.value : '—',
        experience: document.getElementById('description').value || 'N/A'
    };
    var result = await supabaseClient
        .from('disaster_submissions')
        .insert([{ 
            family_name: row.familyName,
            address: row.address,
            members: row.members === '—' ? null : row.members,
            risk: row.risk,
            dexp: row.pastDisaster,
            experience: row.experience,
            epoint: row.evacPoint,
            eplan_answer: row.evacPlan,
            plan_items: row.planDetails,
            kit: row.kit,
            kit_items: row.kitItems,
            kit_need: row.kitNeed
        }])
        .select()
        .single();
    if (result.error) {
        console.error('Disaster submit failed:', result.error.message);
        alert('Failed to save survey record. Please try again.');
        return;
    }
    renderDisasterRow(row);
    this.reset();
    document.getElementById('mayo-section').style.border = '';
    document.getElementById('mayo-section').style.backgroundColor = 'rgba(255,255,255,0.92)';
    loadLandingStats();
});

/* --- Export to CSV (simulated Excel export) --- */
function exportToCSV() {
    var headers = ['Full Name','Address','Contact','Business Name','Stall No.','Goods Sold','Permit No.','ID Type','ID Number'];
    var rows = [headers];
    var tbody = document.getElementById('market-details-body');
    for (var i = 0; i < tbody.rows.length; i++) {
        var cells = tbody.rows[i].cells;
        if (cells[0].colSpan == 9) continue;
        var row = [];
        for (var j = 0; j < cells.length; j++) row.push('"' + cells[j].innerText + '"');
        rows.push(row);
    }
    var csv = rows.map(function(r) { return r.join(','); }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'vendor_records.csv';
    a.click();
}
