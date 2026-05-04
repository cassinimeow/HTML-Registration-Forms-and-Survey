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

function renderMarketRow(row) {
    var tbody = document.getElementById('market-table-body');
    clearPlaceholderRow(tbody, 13);
    var tr = document.createElement('tr');
    if (row.sanitary === 'Poor' || row.wasteSeg === 'No') tr.classList.add('non-compliant');
    tr.innerHTML =
        '<td>' + row.fullname + '</td><td>' + row.address + '</td>' +
        '<td>' + row.contact + '</td><td>' + row.businessName + '</td>' +
        '<td>' + row.stall + '</td><td>' + row.goods + '</td>' +
        '<td>' + row.permit + '</td><td>' + row.idType + '</td>' +
        '<td>' + row.idNumber + '</td><td>' + row.sanitary + '</td>' +
        '<td>' + row.cleanliness + '</td><td>' + row.wasteSeg + '</td>' +
        '<td>' + row.healthCert + '</td>';
    tbody.appendChild(tr);
}

function renderDisasterRow(row) {
    var tbody = document.getElementById('disaster-table-body');
    clearPlaceholderRow(tbody, 12);
    var tr = document.createElement('tr');
    if (row.kit === 'No') tr.classList.add('non-compliant');
    tr.innerHTML =
        '<td>' + row.familyName + '</td><td>' + row.address + '</td>' +
        '<td>' + row.members + '</td><td>' + row.risk + '</td>' +
        '<td>' + row.pastDisaster + '</td><td>' + row.experience + '</td>' +
        '<td>' + row.evacPoint + '</td><td>' + row.evacPlan + '</td>' +
        '<td>' + row.planDetails + '</td><td>' + row.kit + '</td>' +
        '<td>' + row.kitItems + '</td><td>' + row.kitNeed + '</td>';
    tbody.appendChild(tr);
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

document.addEventListener('DOMContentLoaded', function() {
    loadMarketRecords();
    loadDisasterRecords();
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
    if (heroMarketBtn) heroMarketBtn.classList.remove('is-active');
    if (heroDisasterBtn) heroDisasterBtn.classList.remove('is-active');
    if (heroHomeBtn) {
        heroHomeBtn.classList.remove('is-active');
        heroHomeBtn.classList.add('is-hidden');
    }

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
    var disasterTopBtn = document.getElementById('disaster-top-btn');
    var disasterClearBtn = document.getElementById('disaster-clear-btn');
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
        targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    var heroTitle = document.getElementById('hero-title');
    var heroDescription = document.getElementById('hero-description');
    var heroMarketBtn = document.getElementById('hero-market-btn');
    var heroDisasterBtn = document.getElementById('hero-disaster-btn');
    var heroHomeBtn = document.getElementById('hero-home-btn');
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
        } else if (page === 'disaster') {
            heroTitle.textContent = 'Disaster Preparedness Survey';
            heroDescription.textContent = 'Capture household risk awareness, evacuation planning, and emergency kit readiness across communities.';
            if (heroDisasterBtn) heroDisasterBtn.classList.add('is-active');
            if (heroMarketBtn) heroMarketBtn.classList.remove('is-active');
            if (heroHomeBtn) {
                heroHomeBtn.classList.remove('is-active');
                heroHomeBtn.classList.remove('is-hidden');
            }
        } else if (page === 'home') {
            heroTitle.textContent = 'Philippines-Wide Registration & Preparedness';
            heroDescription.textContent = 'Select a form to begin capturing vendor records or disaster readiness data across the country.';
            if (heroMarketBtn) heroMarketBtn.classList.remove('is-active');
            if (heroDisasterBtn) heroDisasterBtn.classList.remove('is-active');
            if (heroHomeBtn) {
                heroHomeBtn.classList.add('is-active');
                heroHomeBtn.classList.add('is-hidden');
            }
        }
    }

    document.getElementById('bg-landing').style.display = page === 'home' ? 'block' : 'none';
    document.getElementById('bg-market').style.display = page === 'market' ? 'block' : 'none';
    document.getElementById('bg-disaster').style.display = page === 'disaster' ? 'block' : 'none';

    if (page === 'home') {
        if (hero) hero.classList.remove('compact');
        document.querySelector('.hero').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        address:      document.getElementById('address').value || '—',
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
        address:    document.getElementById('d-address').value || '—',
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
});

/* --- Export to CSV (simulated Excel export) --- */
function exportToCSV() {
    var headers = ['Full Name','Address','Contact','Business Name','Stall No.','Goods Sold','Permit No.','ID Type','ID Number','Sanitary','Cleanliness','Waste Seg.','Health Cert.'];
    var rows = [headers];
    var tbody = document.getElementById('market-table-body');
    for (var i = 0; i < tbody.rows.length; i++) {
        var cells = tbody.rows[i].cells;
        if (cells[0].colSpan == 13) continue;
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
