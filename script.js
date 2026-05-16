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

function showToast(message, type) {
    var stack = document.getElementById('toast-stack');
    if (!stack) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    var icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    toast.innerHTML =
        '<div class="toast-row">' +
        '<span class="toast-icon">' + icon + '</span>' +
        '<span class="toast-message">' + message + '</span>' +
        '</div>' +
        '<div class="toast-bar"><span></span></div>';
    stack.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(6px)';
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 200);
    }, 3000);
}

function fetchJson(url) {
    return fetch(url).then(function(res) {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
    });
}

function fetchJsonp(url, callbackParam) {
    return new Promise(function(resolve, reject) {
        var callbackName = 'jsonp_' + Math.random().toString(36).slice(2);
        var timeoutId = setTimeout(function() {
            cleanup();
            reject(new Error('JSONP timeout'));
        }, 7000);

        function cleanup() {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (script.parentNode) script.parentNode.removeChild(script);
        }

        window[callbackName] = function(data) {
            cleanup();
            resolve(data);
        };

        var script = document.createElement('script');
        var sep = url.indexOf('?') === -1 ? '?' : '&';
        script.src = url + sep + encodeURIComponent(callbackParam) + '=' + encodeURIComponent(callbackName);
        script.onerror = function() {
            cleanup();
            reject(new Error('JSONP request failed'));
        };
        document.head.appendChild(script);
    });
}

function normalizeLocationText(value) {
    var text = String(value || '').replace(/\s+/g, ' ').trim();
    text = text.replace(/^\s*(city|municipality)\s+of\s+/i, '');
    text = text.replace(/\s*\([^)]*\)\s*/g, ' ');
    if (text.normalize) {
        text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    return text.replace(/\s+/g, ' ').trim();
}

function geocodeLocation(queries) {
    var list = Array.isArray(queries) ? queries : [queries];
    var index = 0;

    function tryNext() {
        if (index >= list.length) return Promise.reject(new Error('No results'));
        var query = list[index++];
        if (!query) return tryNext();

        var photonUrl = 'https://photon.komoot.io/api/?q=' + encodeURIComponent(query) + '&limit=1';
        return fetchJson(photonUrl)
            .then(function(data) {
                if (!data || !data.features || !data.features.length) throw new Error('No results');
                var coords = data.features[0].geometry.coordinates;
                return { lat: coords[1], lon: coords[0] };
            })
            .catch(function() {
                var nominatimUrl = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=' + encodeURIComponent(query);
                return fetchJsonp(nominatimUrl, 'json_callback').then(function(results) {
                    if (!results || !results.length) throw new Error('No results');
                    return { lat: results[0].lat, lon: results[0].lon };
                });
            })
            .catch(function() {
                return tryNext();
            });
    }

    return tryNext();
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function(ch) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
}

function setSelectOptions(select, items, placeholder) {
    if (!select) return;
    select.innerHTML = '';
    var option = document.createElement('option');
    option.value = '';
    option.textContent = placeholder || 'Select';
    select.appendChild(option);
    items.forEach(function(item) {
        var opt = document.createElement('option');
        opt.value = item.value;
        opt.textContent = item.label;
        select.appendChild(opt);
    });
}

function getSelectText(id) {
    var el = document.getElementById(id);
    if (!el || !el.value) return '';
    return el.options[el.selectedIndex].text;
}

var psgcCache = {
    provinces: null,
    cities: {},
    barangays: {},
    provincesDetail: {},
    provinceType: {},
    regionNameByCode: {},
    regions: null
};

function sortByLabel(list) {
    return list.slice().sort(function(a, b) {
        return a.label.localeCompare(b.label);
    });
}

function initAddressSelectors(config) {
    var provinceSelect = document.getElementById(config.provinceId);
    var citySelect = document.getElementById(config.cityId);
    var barangaySelect = document.getElementById(config.barangayId);
    var regionSelect = document.getElementById(config.regionId);

    function setEnabled(selectEl, enabled) {
        if (!selectEl) return;
        selectEl.disabled = !enabled;
        if (!enabled) {
            selectEl.classList.add('select-disabled');
        } else {
            selectEl.classList.remove('select-disabled');
        }
    }

    function resetCityBarangay() {
        setSelectOptions(citySelect, [], 'Select city');
        setSelectOptions(barangaySelect, [], 'Select barangay');
    }

    function resetRegion() {
        setSelectOptions(regionSelect, [], 'Select region');
    }

    fetchRegions().then(function(list) {
        setSelectOptions(regionSelect, list, 'Select region');
        // initial enabled/disabled state
        setEnabled(provinceSelect, !!(regionSelect && regionSelect.value));
        setEnabled(citySelect, !!(provinceSelect && provinceSelect.value));
        setEnabled(barangaySelect, !!(citySelect && citySelect.value));
    });

    if (regionSelect) {
        regionSelect.addEventListener('change', function() {
            var code = regionSelect.value;
            resetCityBarangay();
            setSelectOptions(provinceSelect, [], 'Select province');
            setEnabled(citySelect, false);
            setEnabled(barangaySelect, false);
            if (!code) {
                setEnabled(provinceSelect, false);
                return;
            }
            setEnabled(provinceSelect, true);
            var regionName = psgcCache.regionNameByCode[code] || '';
            var isNcr = regionName.toLowerCase().indexOf('national capital region') !== -1 || code === '130000000';
            if (isNcr) {
                setSelectOptions(provinceSelect, [{ value: code, label: 'Metro Manila' }], 'Select province');
                provinceSelect.value = code;
                setEnabled(provinceSelect, true);
                fetchCities(code).then(function(list) {
                    setSelectOptions(citySelect, list, 'Select city');
                    setEnabled(citySelect, true);
                });
                return;
            }
            fetchProvinces(code).then(function(list) {
                setSelectOptions(provinceSelect, list, 'Select province');
            });
        });
    }

    if (provinceSelect) {
        provinceSelect.addEventListener('change', function() {
            var code = provinceSelect.value;
            setSelectOptions(citySelect, [], 'Select city');
            setSelectOptions(barangaySelect, [], 'Select barangay');
            setEnabled(barangaySelect, false);
            if (!code) {
                setEnabled(citySelect, false);
                return;
            }
            setEnabled(citySelect, true);
            fetchCities(code).then(function(list) {
                setSelectOptions(citySelect, list, 'Select city');
            });
        });
    }

    if (citySelect) {
        citySelect.addEventListener('change', function() {
            var code = citySelect.value;
            setSelectOptions(barangaySelect, [], 'Select barangay');
            if (!code) {
                setEnabled(barangaySelect, false);
                return;
            }
            setEnabled(barangaySelect, true);
            fetchBarangays(code).then(function(list) {
                setSelectOptions(barangaySelect, list, 'Select barangay');
            });
        });
    }
}

function fetchProvinces(regionCode) {
    if (psgcCache.provinces && psgcCache.provinces[regionCode]) {
        return Promise.resolve(psgcCache.provinces[regionCode]);
    }
    var regionName = psgcCache.regionNameByCode[regionCode] || '';
    var isNcr = regionName.toLowerCase().indexOf('national capital region') !== -1 || regionCode === '130000000';
    if (isNcr) {
        var ncrList = [{ value: regionCode, label: 'Metro Manila' }];
        if (!psgcCache.provinces) psgcCache.provinces = {};
        psgcCache.provinces[regionCode] = ncrList;
        psgcCache.provinceType[regionCode] = 'region';
        return Promise.resolve(ncrList);
    }
    return fetchJson('https://psgc.gitlab.io/api/regions/' + regionCode + '/provinces/').then(function(data) {
        var list = data.map(function(item) {
            return { value: item.code, label: item.name };
        });
        list = sortByLabel(list);
        if (!psgcCache.provinces) psgcCache.provinces = {};
        psgcCache.provinces[regionCode] = list;
        return list;
    });
}

function fetchRegions() {
    if (psgcCache.regions) return Promise.resolve(psgcCache.regions);
    return fetchJson('https://psgc.gitlab.io/api/regions/').then(function(data) {
        var list = data.map(function(region) {
            if (!region || !region.name) return null;
            psgcCache.regionNameByCode[region.code] = region.name;
            psgcCache.provinceType[region.code] = 'region';
            return { value: region.code, label: region.name };
        }).filter(Boolean);
        list = sortByLabel(list);
        psgcCache.regions = list;
        return list;
    });
}

function fetchCities(provinceCode) {
    if (psgcCache.cities[provinceCode]) return Promise.resolve(psgcCache.cities[provinceCode]);
    var endpoint = psgcCache.provinceType[provinceCode] === 'region'
        ? 'https://psgc.gitlab.io/api/regions/' + provinceCode + '/cities-municipalities/'
        : 'https://psgc.gitlab.io/api/provinces/' + provinceCode + '/cities-municipalities/';
    return fetchJson(endpoint).then(function(data) {
        var list = data.map(function(item) {
            return { value: item.code, label: item.name };
        });
        list = sortByLabel(list);
        psgcCache.cities[provinceCode] = list;
        return list;
    }).catch(function() {
        if (psgcCache.provinceType[provinceCode] === 'region') {
            return fetchJson('https://psgc.gitlab.io/api/regions/' + provinceCode + '/cities/').then(function(data) {
                var list = data.map(function(item) {
                    return { value: item.code, label: item.name };
                });
                list = sortByLabel(list);
                psgcCache.cities[provinceCode] = list;
                return list;
            });
        }
        return [];
    });
}

function fetchBarangays(cityCode) {
    if (psgcCache.barangays[cityCode]) return Promise.resolve(psgcCache.barangays[cityCode]);
    return fetchJson('https://psgc.gitlab.io/api/cities-municipalities/' + cityCode + '/barangays/').then(function(data) {
        var list = data.map(function(item) {
            return { value: item.code, label: item.name };
        });
        list = sortByLabel(list);
        psgcCache.barangays[cityCode] = list;
        return list;
    }).catch(function() {
        return fetchJson('https://psgc.gitlab.io/api/cities/' + cityCode + '/barangays/').then(function(data) {
            var list = data.map(function(item) {
                return { value: item.code, label: item.name };
            });
            list = sortByLabel(list);
            psgcCache.barangays[cityCode] = list;
            return list;
        });
    });
}

function fetchProvinceDetail(code) {
    if (psgcCache.provincesDetail[code]) return Promise.resolve(psgcCache.provincesDetail[code]);
    return fetchJson('https://psgc.gitlab.io/api/provinces/' + code + '/').then(function(data) {
        psgcCache.provincesDetail[code] = data;
        return data;
    });
}

function formatAddress(parts) {
    var cleaned = parts.map(function(part) {
        return part ? part.trim() : '';
    }).filter(function(part) {
        return part.length > 0;
    });
    return cleaned.length ? cleaned.join(', ') : '—';
}

function deriveAddressFields(address, schema) {
    var parts = getAddressParts(address);
    var empty = {
        street: '—',
        subdivision: '—',
        barangay: '—',
        city: '—',
        province: '—',
        region: '—'
    };
    if (!parts.length) return empty;
    if (schema === 'market' && parts.length >= 6) {
        return {
            street: parts[0] || '—',
            subdivision: parts[1] || '—',
            barangay: parts[2] || '—',
            city: parts[3] || '—',
            province: parts[4] || '—',
            region: parts[5] || '—'
        };
    }
    if (schema === 'disaster' && parts.length >= 6) {
        return {
            street: parts[0] || '—',
            subdivision: parts[1] || '—',
            region: parts[2] || '—',
            province: parts[3] || '—',
            city: parts[4] || '—',
            barangay: parts[5] || '—'
        };
    }
    return empty;
}

function getInputValue(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
}

function renderMarketRow(row) {
    var detailsBody = document.getElementById('market-details-body');
    var complianceBody = document.getElementById('market-compliance-body');
    var addressBody = document.getElementById('market-address-body');
    clearPlaceholderRow(detailsBody, 8);
    clearPlaceholderRow(complianceBody, 5);
    clearPlaceholderRow(addressBody, 7);

    var addressFields = row.addressFields || deriveAddressFields(row.address, 'market');

    var detailsRow = document.createElement('tr');
    var complianceRow = document.createElement('tr');
    var addressRow = document.createElement('tr');
    detailsRow.innerHTML =
        '<td>' + row.fullname + '</td><td>' + row.contact + '</td>' +
        '<td>' + row.businessName + '</td>' +
        '<td>' + row.stall + '</td><td>' + row.goods + '</td>' +
        '<td>' + row.permit + '</td><td>' + row.idType + '</td>' +
        '<td>' + row.idNumber + '</td>';
    complianceRow.innerHTML =
        '<td>' + row.fullname + '</td><td>' + row.sanitary + '</td>' +
        '<td>' + row.cleanliness + '</td><td>' + row.wasteSeg + '</td>' +
        '<td>' + row.healthCert + '</td>';
    addressRow.innerHTML =
        '<td>' + row.fullname + '</td><td>' + addressFields.street + '</td>' +
        '<td>' + addressFields.subdivision + '</td><td>' + addressFields.barangay + '</td>' +
        '<td>' + addressFields.city + '</td><td>' + addressFields.province + '</td>' +
        '<td>' + addressFields.region + '</td>';
    if (row.sanitary === 'Poor' || row.wasteSeg === 'No') {
        complianceRow.classList.add('non-compliant');
    }
    detailsBody.appendChild(detailsRow);
    complianceBody.appendChild(complianceRow);
    if (addressBody) addressBody.appendChild(addressRow);
}

function renderDisasterRow(row) {
    var householdBody = document.getElementById('disaster-household-body');
    var preparednessBody = document.getElementById('disaster-preparedness-body');
    var addressBody = document.getElementById('disaster-address-body');
    clearPlaceholderRow(householdBody, 2);
    clearPlaceholderRow(preparednessBody, 10);
    clearPlaceholderRow(addressBody, 7);
    var addressFields = row.addressFields || deriveAddressFields(row.address, 'disaster');
    var householdRow = document.createElement('tr');
    var preparednessRow = document.createElement('tr');
    var addressRow = document.createElement('tr');
    householdRow.innerHTML =
        '<td>' + row.familyName + '</td><td>' + row.members + '</td>';
    preparednessRow.innerHTML =
        '<td>' + row.familyName + '</td><td>' + row.risk + '</td>' +
        '<td>' + row.pastDisaster + '</td><td>' + row.experience + '</td>' +
        '<td>' + row.evacPoint + '</td><td>' + row.evacPlan + '</td>' +
        '<td>' + row.planDetails + '</td><td>' + row.kit + '</td>' +
        '<td>' + row.kitItems + '</td><td>' + row.kitNeed + '</td>';
    addressRow.innerHTML =
        '<td>' + row.familyName + '</td><td>' + addressFields.street + '</td>' +
        '<td>' + addressFields.subdivision + '</td><td>' + addressFields.barangay + '</td>' +
        '<td>' + addressFields.city + '</td><td>' + addressFields.province + '</td>' +
        '<td>' + addressFields.region + '</td>';
    if (row.kit === 'No') preparednessRow.classList.add('non-compliant');
    householdBody.appendChild(householdRow);
    preparednessBody.appendChild(preparednessRow);
    if (addressBody) addressBody.appendChild(addressRow);
    renderMapRow(row);
}

function getAddressParts(address) {
    if (!address || address === '—') return [];
    return address.split(',').map(function(part) {
        return part.trim();
    }).filter(Boolean);
}

function getBarangayCityFromAddress(address) {
    var parts = getAddressParts(address);
    var last = parts[parts.length - 1] || '';
    if (/region|ncr|national capital region|metro manila/i.test(last)) {
        parts = parts.slice(0, -1);
    }
    if (parts.length < 2) return { barangay: '—', city: '—' };
    return {
        barangay: parts[parts.length - 1] || '—',
        city: parts[parts.length - 2] || '—'
    };
}

function renderMapRow(row) {
    var mapBody = document.getElementById('map-table-body');
    if (!mapBody) return;
    clearPlaceholderRow(mapBody, 4);
    var loc = {
        barangay: row.barangay || '',
        city: row.city || ''
    };
    var addressFields = row.addressFields || deriveAddressFields(row.address, 'disaster');
    if (!loc.barangay || !loc.city) {
        loc = getBarangayCityFromAddress(row.address);
    }
    var tr = document.createElement('tr');
    var safeAddress = escapeHtml(row.address || '');
    tr.innerHTML =
        '<td>' + row.familyName + '</td>' +
        '<td>' + loc.barangay + '</td>' +
        '<td>' + loc.city + '</td>' +
        '<td><button class="map-zoom-btn" data-barangay="' + loc.barangay + '" data-city="' + loc.city + '" data-region="' + (addressFields.region || '') + '" data-address="' + safeAddress + '">🔍 View</button></td>';
    mapBody.appendChild(tr);
    updateMapAnalytics();
}

function updateMapAnalytics() {
    var mapBody = document.getElementById('map-table-body');
    if (!mapBody) return;
    var rows = Array.prototype.slice.call(mapBody.querySelectorAll('tr'));
    var countsCity = {};
    var countsRegion = {};
    var total = 0;

    rows.forEach(function(row) {
        var btn = row.querySelector('.map-zoom-btn');
        if (!btn) return;
        var city = btn.getAttribute('data-city') || '—';
        var region = btn.getAttribute('data-region') || '—';
        total += 1;
        countsCity[city] = (countsCity[city] || 0) + 1;
        countsRegion[region] = (countsRegion[region] || 0) + 1;
    });

    function getTopLabel(counts) {
        var topLabel = '—';
        var topCount = 0;
        Object.keys(counts).forEach(function(key) {
            if (counts[key] > topCount && key !== '—') {
                topLabel = key + ' (' + counts[key] + ')';
                topCount = counts[key];
            }
        });
        return topLabel;
    }

    var uniqueCities = Object.keys(countsCity).filter(function(key) { return key !== '—'; }).length;
    var clicks = parseInt(localStorage.getItem('gisLookupClicks') || '0', 10);

    var totalEl = document.getElementById('map-total');
    var uniqueEl = document.getElementById('map-unique-cities');
    var topCityEl = document.getElementById('map-top-city');
    var topRegionEl = document.getElementById('map-top-region');
    var clicksEl = document.getElementById('map-clicks');
    if (totalEl) totalEl.textContent = total;
    if (uniqueEl) uniqueEl.textContent = uniqueCities;
    if (topCityEl) topCityEl.textContent = getTopLabel(countsCity);
    if (topRegionEl) topRegionEl.textContent = getTopLabel(countsRegion);
    if (clicksEl) clicksEl.textContent = clicks;
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
            addressFields: deriveAddressFields(item.address || '—', 'market'),
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
            addressFields: deriveAddressFields(item.address || '—', 'disaster'),
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
    showToast('Welcome! Select a form to begin.', 'info');
    document.getElementById('bg-landing').style.display = 'block';
    document.getElementById('bg-market').style.display = 'none';
    document.getElementById('bg-disaster').style.display = 'none';
    var heroTitle = document.getElementById('hero-title');
    var heroDescription = document.getElementById('hero-description');
    if (heroTitle && heroDescription) {
        heroTitle.textContent = 'Philippine-Wide Vendor Registration & Disaster Preparedness Form';
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

    initAddressSelectors({
        provinceId: 'addressProvince',
        cityId: 'addressCity',
        barangayId: 'addressBarangay',
        regionId: 'addressRegion'
    });
    initAddressSelectors({
        provinceId: 'd-address-province',
        cityId: 'd-address-city',
        barangayId: 'd-address-barangay',
        regionId: 'd-address-region'
    });
    if (devTeam) devTeam.style.display = 'block';
    if (landingFooter) landingFooter.style.display = 'block';

    var idTypeInput = document.getElementById('idType');
    var idNumberInput = document.getElementById('idNumber');
    function attachInputFilter(input, pattern) {
        if (!input) return;
        input.addEventListener('input', function() {
            var cleaned = input.value.replace(pattern, '');
            if (cleaned !== input.value) input.value = cleaned;
        });
    }
    attachInputFilter(document.getElementById('fullname'), /[^A-Za-z .'-]/g);
    attachInputFilter(document.getElementById('family-name'), /[^A-Za-z .'-]/g);
    attachInputFilter(document.getElementById('contact'), /[^0-9+()\s-]/g);
    attachInputFilter(document.getElementById('family-members'), /[^0-9]/g);
    var idTypeConfig = {
        'PhilSys (National ID)': { placeholder: '1234-5678-9012', pattern: '^\\d{4}-\\d{4}-\\d{4}$' },
        'Philippine Passport': { placeholder: 'P1234567', pattern: '^[A-Z]{1}\\d{7,8}$' },
        "Driver's License": { placeholder: 'A12-34-567890', pattern: '^[A-Z]\\d{2}-\\d{2}-\\d{6}$' },
        'UMID': { placeholder: '0000-0000000-0', pattern: '^\\d{4}-\\d{7}-\\d{1}$' },
        'SSS ID': { placeholder: '00-0000000-0', pattern: '^\\d{2}-\\d{7}-\\d{1}$' },
        'GSIS ID': { placeholder: '00-0000000-0', pattern: '^\\d{2}-\\d{7}-\\d{1}$' },
        'PRC ID': { placeholder: '1234567', pattern: '^\\d{6,8}$' },
        'Postal ID': { placeholder: '0000-0000-0000', pattern: '^\\d{4}-\\d{4}-\\d{4}$' },
        'PhilHealth ID': { placeholder: '00-000000000-0', pattern: '^\\d{2}-\\d{9}-\\d{1}$' },
        'TIN ID': { placeholder: '000-000-000-000', pattern: '^\\d{3}-\\d{3}-\\d{3}-\\d{3}$' },
        "Voter's ID": { placeholder: 'ABCD-1234-5678', pattern: '^[A-Z]{2,4}-\\d{4}-\\d{4}$' },
        'Other': { placeholder: 'Enter ID number', pattern: '' }
    };

    function validateIdNumber() {
        if (!idNumberInput) return;
        var pattern = idNumberInput.dataset.pattern || '';
        var value = idNumberInput.value.trim();
        if (!pattern || !value) {
            idNumberInput.removeAttribute('aria-invalid');
            return;
        }
        var ok = new RegExp(pattern).test(value);
        idNumberInput.setAttribute('aria-invalid', ok ? 'false' : 'true');
    }

    function syncIdNumberState() {
        if (!idTypeInput || !idNumberInput) return;
        var hasType = idTypeInput.value.trim().length > 0;
        idNumberInput.disabled = !hasType;
        idNumberInput.required = hasType;
        if (!hasType) {
            idNumberInput.value = '';
            idNumberInput.placeholder = 'e.g. 1234-5678-9012';
            idNumberInput.dataset.pattern = '';
            idNumberInput.title = '';
            idNumberInput.removeAttribute('aria-invalid');
            return;
        }
        var config = idTypeConfig[idTypeInput.value] || { placeholder: 'Enter ID number', pattern: '' };
        idNumberInput.placeholder = config.placeholder;
        idNumberInput.dataset.pattern = config.pattern;
        idNumberInput.title = config.pattern ? 'Suggested format: ' + config.placeholder : '';
        validateIdNumber();
    }
    if (idTypeInput) {
        idTypeInput.addEventListener('input', syncIdNumberState);
    }
    if (idNumberInput) {
        idNumberInput.addEventListener('input', validateIdNumber);
        idNumberInput.addEventListener('blur', validateIdNumber);
    }
    syncIdNumberState();

    var descriptionInput = document.getElementById('description');
    var eplanInputs = document.querySelectorAll('input[name="eplan"]');
    var planChecks = document.querySelectorAll('input[name="plan"]');
    var kitReadyInputs = document.querySelectorAll('input[name="kit_ready"]');
    var kitItemChecks = document.querySelectorAll('input[name="kit_items"]');
    var cleanlinessChecks = document.querySelectorAll('input[name="cleanliness[]"]');

    function setCheckboxGroupValidity(inputs, required, message) {
        if (!inputs.length) return;
        var anyChecked = Array.prototype.some.call(inputs, function(input) { return input.checked; });
        var first = inputs[0];
        first.required = !!required;
        first.setCustomValidity(required && !anyChecked ? (message || 'Please select at least one.') : '');
    }

    function updateConditionalRequirements() {
        var dexpYes = (document.querySelector('input[name="dexp"]:checked') || {}).value === 'Yes';
        if (descriptionInput) descriptionInput.required = !!dexpYes;

        var eplanYes = (document.querySelector('input[name="eplan"]:checked') || {}).value === 'Yes';
        setCheckboxGroupValidity(planChecks, eplanYes, 'Select at least one plan.');

        var kitYes = (document.querySelector('input[name="kit_ready"]:checked') || {}).value === 'Yes';
        setCheckboxGroupValidity(kitItemChecks, kitYes, 'Select at least one kit item.');

        setCheckboxGroupValidity(cleanlinessChecks, true, 'Select at least one cleanliness option.');
    }

    document.querySelectorAll('input[name="dexp"], input[name="eplan"], input[name="kit_ready"]').forEach(function(input) {
        input.addEventListener('change', updateConditionalRequirements);
    });
    planChecks.forEach(function(input) { input.addEventListener('change', updateConditionalRequirements); });
    kitItemChecks.forEach(function(input) { input.addEventListener('change', updateConditionalRequirements); });
    cleanlinessChecks.forEach(function(input) { input.addEventListener('change', updateConditionalRequirements); });
    updateConditionalRequirements();

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
            initAddressSelectors({
                provinceId: 'addressProvince',
                cityId: 'addressCity',
                barangayId: 'addressBarangay',
                regionId: 'addressRegion'
            });
            showToast('Market form cleared.', 'info');
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
            initAddressSelectors({
                provinceId: 'd-address-province',
                cityId: 'd-address-city',
                barangayId: 'd-address-barangay',
                regionId: 'd-address-region'
            });
            showToast('Disaster form cleared.', 'info');
        });
    }

    var mapTable = document.getElementById('map-table-body');
    if (mapTable) {
        mapTable.addEventListener('click', function(event) {
            var target = event.target.closest('.map-zoom-btn');
            if (!target) return;
            var barangay = target.getAttribute('data-barangay') || '';
            var city = target.getAttribute('data-city') || '';
            var address = target.getAttribute('data-address') || '';
            var cleanAddress = normalizeLocationText(address);
            var cleanBarangay = normalizeLocationText(barangay);
            var cleanCity = normalizeLocationText(city);
            var queryRaw = [address, barangay, city, 'Philippines'].filter(Boolean).join(', ');
            var queryVariants = [
                queryRaw,
                [barangay, city, 'Philippines'].filter(Boolean).join(', '),
                [cleanBarangay, cleanCity, 'Philippines'].filter(Boolean).join(', '),
                [cleanCity, 'Philippines'].filter(Boolean).join(', ')
            ];
            var iframe = document.querySelector('#map-placeholder iframe');
            var hazardLink = document.getElementById('hazardhunter-link');
            if (iframe) {
                geocodeLocation(queryVariants)
                    .then(function(point) {
                        var lat = point.lat;
                        var lon = point.lon;
                        var bbox = [
                            (parseFloat(lon) - 0.01),
                            (parseFloat(lat) - 0.01),
                            (parseFloat(lon) + 0.01),
                            (parseFloat(lat) + 0.01)
                        ].join('%2C');
                        iframe.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + bbox + '&layer=mapnik&marker=' + lat + '%2C' + lon;
                        if (hazardLink) hazardLink.href = 'https://hazardhunter.georisk.gov.ph/map#map=14/' + lat + '/' + lon;
                        localStorage.setItem('gisLookupClicks', String(parseInt(localStorage.getItem('gisLookupClicks') || '0', 10) + 1));
                        updateMapAnalytics();
                        showToast('Map focus: ' + [barangay, city].filter(Boolean).join(', '), 'info');
                    })
                    .catch(function() {
                        iframe.src = 'https://www.openstreetmap.org/export/embed.html?bbox=116.9%2C4.5%2C127.1%2C20.8&layer=mapnik';
                        if (hazardLink) hazardLink.href = 'https://hazardhunter.georisk.gov.ph/map';
                        updateMapAnalytics();
                        showToast('Location not found. Open the map to search.', 'error');
                    });
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
            heroTitle.textContent = 'Philippine-Wide Vendor Registration & Disaster Preparedness Form';
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
            getSelectText('addressBarangay'),
            getSelectText('addressCity'),
            getSelectText('addressProvince'),
            getSelectText('addressRegion')
        ]),
        addressFields: {
            street: getInputValue('addressStreet') || '—',
            subdivision: getInputValue('addressSubdivision') || '—',
            barangay: getSelectText('addressBarangay') || '—',
            city: getSelectText('addressCity') || '—',
            province: getSelectText('addressProvince') || '—',
            region: getSelectText('addressRegion') || '—'
        },
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
    initAddressSelectors({
        provinceId: 'addressProvince',
        cityId: 'addressCity',
        barangayId: 'addressBarangay',
        regionId: 'addressRegion'
    });
    showToast('Vendor record saved.', 'success');
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
            getSelectText('d-address-region'),
            getSelectText('d-address-province'),
            getSelectText('d-address-city'),
            getSelectText('d-address-barangay')
        ]),
        addressFields: {
            street: getInputValue('d-address-street') || '—',
            subdivision: getInputValue('d-address-subdivision') || '—',
            barangay: getSelectText('d-address-barangay') || '—',
            city: getSelectText('d-address-city') || '—',
            province: getSelectText('d-address-province') || '—',
            region: getSelectText('d-address-region') || '—'
        },
        city:       getSelectText('d-address-city') || '—',
        barangay:   getSelectText('d-address-barangay') || '—',
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
    initAddressSelectors({
        provinceId: 'd-address-province',
        cityId: 'd-address-city',
        barangayId: 'd-address-barangay',
        regionId: 'd-address-region'
    });
    showToast('Survey record saved.', 'success');
});

/* --- Export to CSV (single table or all tables) --- */
function escapeCell(text) {
    if (text === null || text === undefined) return '';
    var s = String(text).replace(/"/g, '""');
    return '"' + s + '"';
}

function csvFromTbody(tbodyId) {
    var tbody = document.getElementById(tbodyId);
    if (!tbody) return null;
    var table = tbody.closest('table');
    var headers = [];
    if (table) {
        var ths = table.querySelectorAll('thead th');
        ths.forEach(function(th) { headers.push(th.innerText.trim()); });
    }
    var rows = [];
    if (headers.length) rows.push(headers.map(escapeCell).join(','));
    for (var i = 0; i < tbody.rows.length; i++) {
        var tr = tbody.rows[i];
        var cells = tr.cells;
        if (cells.length === 1 && cells[0].colSpan > 1) {
            // likely placeholder 'No records yet.' skip
            continue;
        }
        var row = [];
        for (var j = 0; j < cells.length; j++) {
            row.push(escapeCell(cells[j].innerText.trim()));
        }
        rows.push(row.join(','));
    }
    return rows.join('\n');
}

function downloadBlob(text, filename) {
    var a = document.createElement('a');
    var blobUrl = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    a.href = blobUrl;
    a.download = filename;
    // Append to DOM to ensure click works in some browsers
    document.body.appendChild(a);
    a.click();
    // cleanup
    setTimeout(function() {
        URL.revokeObjectURL(blobUrl);
        a.remove();
    }, 1000);
}

function timestampForFilename() {
    var d = new Date();
    function pad(n){return n<10? '0'+n : String(n);} 
    var y = d.getFullYear();
    var m = pad(d.getMonth()+1);
    var day = pad(d.getDate());
    var hh = pad(d.getHours());
    var mm = pad(d.getMinutes());
    return y + m + day + '_' + hh + mm;
}

function exportToCSV(target) {
    // target: tbody id or 'all'
    var mapping = [
        { id: 'market-details-body', name: 'vendor_details' },
        { id: 'market-address-body', name: 'vendor_address' },
        { id: 'market-compliance-body', name: 'vendor_compliance' },
        { id: 'disaster-household-body', name: 'household_info' },
        { id: 'disaster-address-body', name: 'household_address' },
        { id: 'disaster-preparedness-body', name: 'household_preparedness' },
        { id: 'map-table-body', name: 'gis_lookup' }
    ];

    if (!target || target === 'all') {
        // determine which page is visible and only export relevant tables
        function activePage() {
            var marketPage = document.getElementById('market-page');
            var disasterPage = document.getElementById('disaster-page');
            try {
                if (marketPage && window.getComputedStyle(marketPage).display !== 'none') return 'market';
                if (disasterPage && window.getComputedStyle(disasterPage).display !== 'none') return 'disaster';
            } catch (e) {}
            return null;
        }

        var page = activePage();
        var parts = [];
        var filtered = mapping.filter(function(m) {
            if (!page) return true; // fallback: include all
            if (page === 'market') return m.id && m.id.indexOf('market-') === 0;
            if (page === 'disaster') return m.id && m.id.indexOf('disaster-') === 0;
            return false;
        });

        filtered.forEach(function(m) {
            var csv = csvFromTbody(m.id);
            if (!csv) return;
            parts.push('"' + (m.name || m.id) + '"');
            parts.push(csv);
            parts.push('');
        });

        if (!parts.length) {
            showToast('No data available to export for this page.', 'info');
            return;
        }
        var ts = timestampForFilename();
        var filename = (page ? page + '_reports_' : 'all_reports_') + ts + '.csv';
        downloadBlob(parts.join('\n'), filename);
        showToast('Exported ' + (page || 'all') + ' tables to CSV.', 'success');
        return;
    }

    var csv = csvFromTbody(target);
    if (!csv) {
        showToast('No data in selected table.', 'info');
        return;
    }
    var name = target.replace(/[^a-z0-9_-]/gi, '_');
    var ts = timestampForFilename();
    downloadBlob(csv, name + '_' + ts + '.csv');
    showToast('Exported ' + target + ' to CSV.', 'success');
}
