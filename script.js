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
    clearPlaceholderRow(tbody, 8);
    var tr = document.createElement('tr');
    if (row.sanitary === 'Poor' || row.wasteSeg === 'No') tr.classList.add('non-compliant');
    tr.innerHTML =
        '<td>' + row.fullname + '</td><td>' + row.businessName + '</td>' +
        '<td>' + row.stall + '</td><td>' + row.goods + '</td>' +
        '<td>' + row.permit + '</td><td>' + row.sanitary + '</td>' +
        '<td>' + row.wasteSeg + '</td><td>' + row.healthCert + '</td>';
    tbody.appendChild(tr);
}

function renderDisasterRow(row) {
    var tbody = document.getElementById('disaster-table-body');
    clearPlaceholderRow(tbody, 7);
    var tr = document.createElement('tr');
    if (row.kit === 'No') tr.classList.add('non-compliant');
    tr.innerHTML =
        '<td>' + row.familyName + '</td><td>' + row.address + '</td>' +
        '<td>' + row.members + '</td><td>' + row.risk + '</td>' +
        '<td>' + row.kit + '</td><td>' + row.eplan + '</td>' +
        '<td>' + row.experience + '</td>';
    tbody.appendChild(tr);
}

async function loadMarketRecords() {
    var result = await supabaseClient
        .from('market_submissions')
        .select('fullname,business_name,stall,goods,permit,sanitary,waste_seg,health_cert,created_at')
        .order('created_at', { ascending: true });
    if (result.error) {
        console.warn('Failed to load market records:', result.error.message);
        return;
    }
    result.data.forEach(function(item) {
        renderMarketRow({
            fullname: item.fullname || '—',
            businessName: item.business_name || '—',
            stall: item.stall || '—',
            goods: item.goods || '—',
            permit: item.permit || '—',
            sanitary: item.sanitary || '—',
            wasteSeg: item.waste_seg || '—',
            healthCert: item.health_cert || '—'
        });
    });
}

async function loadDisasterRecords() {
    var result = await supabaseClient
        .from('disaster_submissions')
        .select('family_name,address,members,risk,kit,eplan,experience,created_at')
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
            kit: item.kit || '—',
            eplan: item.eplan || '—',
            experience: item.experience || 'N/A'
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    loadMarketRecords();
    loadDisasterRecords();
});

/* --- Switch pages via navbar --- */
function showPage(page) {
    document.getElementById('market-page').style.display = 'none';
    document.getElementById('disaster-page').style.display = 'none';
    document.getElementById(page + '-page').style.display = 'block';

    document.getElementById('btn-market').classList.remove('active');
    document.getElementById('btn-disaster').classList.remove('active');
    document.getElementById('btn-' + page).classList.add('active');

    document.getElementById('bg-market').style.display = page === 'market' ? 'block' : 'none';
    document.getElementById('bg-disaster').style.display = page === 'disaster' ? 'block' : 'none';
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
    var row = {
        fullname:     document.getElementById('fullname').value || '—',
        businessName: document.getElementById('businessName').value || '—',
        stall:        document.getElementById('stall').value || '—',
        goods:        document.getElementById('goods').value || '—',
        permit:       document.getElementById('permit').value || '—',
        sanitary:     sanitary ? sanitary.value : '—',
        wasteSeg:     wasteSeg ? wasteSeg.value : '—',
        healthCert:   document.getElementById('healthStatus').value
    };
    var result = await supabaseClient
        .from('market_submissions')
        .insert([{ 
            fullname: row.fullname,
            business_name: row.businessName,
            stall: row.stall,
            goods: row.goods,
            permit: row.permit,
            sanitary: row.sanitary,
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
    var kitReady = document.querySelector('input[name="kit_ready"]:checked');
    var plans = [];
    document.querySelectorAll('input[name="plan"]:checked').forEach(function(cb) { plans.push(cb.value); });
    var row = {
        familyName: document.getElementById('family-name').value || '—',
        address:    document.getElementById('d-address').value || '—',
        members:    document.getElementById('family-members').value || '—',
        risk:       document.getElementById('risk').value,
        kit:        kitReady ? kitReady.value : '—',
        eplan:      plans.length > 0 ? plans.join(', ') : '—',
        experience: document.getElementById('description').value || 'N/A'
    };
    var result = await supabaseClient
        .from('disaster_submissions')
        .insert([{ 
            family_name: row.familyName,
            address: row.address,
            members: row.members === '—' ? null : row.members,
            risk: row.risk,
            kit: row.kit,
            eplan: row.eplan,
            experience: row.experience
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
    var headers = ['Full Name','Business Name','Stall No.','Goods Sold','Permit No.','Sanitary','Waste Seg.','Health Cert.'];
    var rows = [headers];
    var tbody = document.getElementById('market-table-body');
    for (var i = 0; i < tbody.rows.length; i++) {
        var cells = tbody.rows[i].cells;
        if (cells[0].colSpan == 8) continue;
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
