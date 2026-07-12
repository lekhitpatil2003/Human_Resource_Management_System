
/* ═══════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════ */
let API_BASE = 'http://localhost:8080';
let _cache = { ads:[], seekers:[], employers:[], cities:[], positions:[] };
let _adsFiltered = [];
let _empFiltered = [];
let _seekerFiltered = [];

/* ═══════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════ */
const PAGE_TITLES = {
  'dashboard':'Dashboard','job-ads':'Job Advertisements','applications':'Applications',
  'employers':'Employers','seekers':'Job Seekers','job-positions':'Job Positions',
  'cities':'Cities','hr-employees':'HR Employees','api-explorer':'API Explorer',
  'demo-employees':'Employees','demo-departments':'Departments','demo-leave':'Leave Types',
  'demo-apply-leave':'Apply Leave','demo-password':'Change Password'
};

function navigate(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav .nav-link').forEach(l => l.classList.remove('active'));
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  const link = document.querySelector(`.sidebar-nav .nav-link[data-page="${pageId}"]`);
  if (link) link.classList.add('active');
  document.getElementById('topbar-title').textContent = PAGE_TITLES[pageId] || pageId;
  onPageLoad(pageId);
  closeSidebarOnMobile();
}

document.querySelectorAll('.sidebar-nav .nav-link[data-page]').forEach(link => {
  link.addEventListener('click', () => navigate(link.dataset.page));
});

/* ─── Mobile sidebar open/close (with backdrop) ─── */
function closeSidebarOnMobile() {
  if (window.innerWidth <= 991) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarBackdrop').classList.remove('open');
  }
}
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarBackdrop').classList.toggle('open');
});
document.getElementById('sidebarBackdrop').addEventListener('click', closeSidebarOnMobile);

/* ─── Profile dropdown ─── */
document.getElementById('profileTrigger').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('profileMenu').classList.toggle('open');
});
document.addEventListener('click', () => {
  document.getElementById('profileMenu').classList.remove('open');
});

function onPageLoad(page) {
  if (page === 'dashboard') loadDashboard();
  else if (page === 'job-ads') loadAds();
  else if (page === 'employers') loadEmployers();
  else if (page === 'seekers') loadSeekers();
  else if (page === 'job-positions') loadPositions();
  else if (page === 'cities') loadCities();
  else if (page === 'hr-employees') loadHrEmployees();
  else if (page === 'api-explorer') initApiExplorer();
  else if (page === 'demo-employees') renderDemoEmployees();
  else if (page === 'demo-departments') renderDemoDepartments();
  else if (page === 'demo-leave') renderDemoLeaveTypes();
  else if (page === 'demo-apply-leave') { populateDemoLeaveDropdowns(); renderDemoLeaveRequests(); }
}

/* ═══════════════════════════════════════════════════════
   API HELPER
═══════════════════════════════════════════════════════ */
async function api(method, path, body) {
  const url = (document.getElementById('api-base-url')?.value || API_BASE).replace(/\/$/, '') + path;
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const json = await res.json();
  return { ok: res.ok, status: res.status, data: json };
}

/* ═══════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════ */
function toast(msg, type='success') {
  const icons = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', warning:'bi-exclamation-triangle-fill' };
  const colors = { success:'var(--success)', error:'var(--danger)', warning:'var(--warning)' };
  const el = document.createElement('div');
  el.className = `toast-item ${type}`;
  el.style.borderLeftColor = colors[type];
  el.innerHTML = `<i class="bi ${icons[type]||icons.success}" style="color:${colors[type]};font-size:16px"></i><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════ */
async function loadDashboard() {
  try {
    const [ads, seekers, employers, cities, positions] = await Promise.allSettled([
      api('GET','/api/jobPost/getAll'), api('GET','/api/candidateController/getAll'),
      api('GET','/api/employers/getAll'), api('GET','/api/cities/getAll'),
      api('GET','/api/jobPosition/getAll')
    ]);

    const getList = r => (r.status==='fulfilled' && r.value.ok) ? (r.value.data.data || []) : [];
    _cache.ads = getList(ads);
    _cache.seekers = getList(seekers);
    _cache.employers = getList(employers);
    _cache.cities = getList(cities);
    _cache.positions = getList(positions);

    document.getElementById('stat-ads').textContent = _cache.ads.length || '—';
    document.getElementById('stat-seekers').textContent = _cache.seekers.length || '—';
    document.getElementById('stat-employers').textContent = _cache.employers.length || '—';
    document.getElementById('stat-cities').textContent = _cache.cities.length || '—';

    updateApiStatus(true);

    // Active ads list
    const activeAds = _cache.ads.filter(a=>a.active).slice(0,6);
    const adsList = document.getElementById('dash-ads-list');
    if (activeAds.length === 0) {
      adsList.innerHTML = '<div class="empty-state"><i class="bi bi-megaphone"></i><p>No active job ads yet</p></div>';
    } else {
      adsList.innerHTML = `<table class="table table-custom mb-0"><tbody>${
        activeAds.map(a=>`<tr>
          <td><strong>${escHtml(a.jobTitle||'—')}</strong><br><small class="text-muted">${escHtml(a.companyName||'')}</small></td>
          <td><span class="badge-active">Active</span></td>
          <td class="text-muted" style="font-size:12px">${formatDate(a.applicationDeadline)}</td>
        </tr>`).join('')
      }</tbody></table>`;
    }

    // Cities list
    const citiesList = document.getElementById('dash-cities-list');
    if (_cache.cities.length === 0) {
      citiesList.innerHTML = '<div class="empty-state"><i class="bi bi-geo-alt"></i><p>No cities added yet</p></div>';
    } else {
      citiesList.innerHTML = `<div class="px-3 py-2 d-flex flex-wrap gap-2">${
        _cache.cities.map(c=>`<span class="badge-soft-blue">${escHtml(c.cityName)}</span>`).join('')
      }</div>`;
    }

    // Positions list
    const posList = document.getElementById('dash-positions-list');
    if (_cache.positions.length === 0) {
      posList.innerHTML = '<div class="empty-state"><i class="bi bi-briefcase"></i><p>No positions added yet</p></div>';
    } else {
      posList.innerHTML = `<div class="px-3 py-2 d-flex flex-wrap gap-2">${
        _cache.positions.map(p=>`<span class="badge-pending">${escHtml(p.title)}</span>`).join('')
      }</div>`;
    }

  } catch(e) {
    updateApiStatus(false);
    setStatNA();
    document.getElementById('dash-ads-list').innerHTML = '<div class="empty-state"><i class="bi bi-wifi-off"></i><p>Cannot reach API. Check your URL in API Explorer.</p></div>';
    document.getElementById('dash-cities-list').innerHTML = '';
    document.getElementById('dash-positions-list').innerHTML = '';
  }
}

function setStatNA() {
  ['stat-ads','stat-seekers','stat-employers','stat-cities'].forEach(id => {
    document.getElementById(id).textContent = '—';
  });
}

function updateApiStatus(ok) {
  const b = document.getElementById('api-status-badge');
  b.textContent = ok ? '⬤ Online' : '⬤ Offline';
  b.style.background = ok ? 'var(--success)' : 'var(--danger)';
}

/* ═══════════════════════════════════════════════════════
   JOB ADVERTISEMENTS
═══════════════════════════════════════════════════════ */
async function loadAds() {
  const tbody = document.getElementById('ads-table-body');
  tbody.innerHTML = '<tr><td colspan="8"><div class="spinner-wrap"><div class="spinner-border"></div></div></td></tr>';
  try {
    const r = await api('GET','/api/jobPost/getAll');
    if (r.ok) {
      _cache.ads = r.data.data || [];
      _adsFiltered = [..._cache.ads];
      renderAdsTable(_adsFiltered);
    } else {
      tbody.innerHTML = errRow(8, r.data.message || 'Failed to load');
    }
  } catch(e) {
    tbody.innerHTML = errRow(8, 'Cannot reach API');
  }
}

function renderAdsTable(list) {
  const tbody = document.getElementById('ads-table-body');
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="8">${emptyHtml('No job advertisements found')}</td></tr>`; return; }
  tbody.innerHTML = list.map((a,i) => `
    <tr>
      <td class="text-muted">${a.id}</td>
      <td><strong>${escHtml(a.jobTitle||'—')}</strong></td>
      <td>${escHtml(a.companyName||'—')}</td>
      <td>${escHtml(a.city||'—')}</td>
      <td>${salaryRange(a.minSalary, a.maxSalary)}</td>
      <td>${formatDate(a.applicationDeadline)}</td>
      <td>${a.active ? '<span class="badge-active">Active</span>' : '<span class="badge-inactive">Inactive</span>'}</td>
      <td>
        <button class="btn-sm-action" onclick="viewAdApplications(${a.id})"><i class="bi bi-eye"></i> Apps</button>
      </td>
    </tr>`).join('');
}

function filterAds() {
  const q = document.getElementById('ads-search').value.toLowerCase();
  const status = document.getElementById('ads-filter-status').value;
  _adsFiltered = _cache.ads.filter(a => {
    const matchText = !q || (a.jobTitle||'').toLowerCase().includes(q) || (a.companyName||'').toLowerCase().includes(q);
    const matchStatus = !status || (status==='active'?a.active:!a.active);
    return matchText && matchStatus;
  });
  renderAdsTable(_adsFiltered);
}

function viewAdApplications(adId) {
  navigate('applications');
  document.getElementById('app-ad-id').value = adId;
  setTimeout(loadApplicationsByAd, 300);
}

async function addJobAd() {
  const posId = document.getElementById('ad-position-id').value;
  const cityId = document.getElementById('ad-city-id').value;
  const empId = document.getElementById('ad-employer-id').value;
  const desc = document.getElementById('ad-description').value;
  const count = document.getElementById('ad-open-count').value;
  const minS = document.getElementById('ad-min-salary').value;
  const maxS = document.getElementById('ad-max-salary').value;
  const dl = document.getElementById('ad-deadline').value;

  if (!posId||!cityId||!empId||!desc||!count||!dl) { toast('Please fill in all required fields.','warning'); return; }

  const body = {
    jobPositionId: +posId, cityId: +cityId, employerId: +empId,
    description: desc, openPositionCount: +count,
    minSalary: minS?+minS:null, maxSalary: maxS?+maxS:null,
    applicationDeadline: dl
  };
  try {
    const r = await api('POST','/api/jobPost/add', body);
    if (r.ok && r.data.success) {
      toast('Job advertisement posted!');
      bootstrap.Modal.getInstance(document.getElementById('modal-add-ad')).hide();
      loadAds();
      loadDashboard();
    } else {
      toast(r.data.message || 'Failed to post ad.', 'error');
    }
  } catch(e) { toast('API error: '+e.message,'error'); }
}

/* Populate dropdowns when modal opens */
document.getElementById('modal-add-ad').addEventListener('show.bs.modal', async () => {
  await Promise.all([loadPositionDropdown(), loadCityDropdown()]);
});

async function loadPositionDropdown() {
  const sel = document.getElementById('ad-position-id');
  sel.innerHTML = '<option value="">Loading…</option>';
  try {
    const r = await api('GET','/api/jobPosition/getAll');
    const list = r.ok ? (r.data.data||[]) : [];
    sel.innerHTML = '<option value="">Select position…</option>' + list.map(p=>`<option value="${p.id}">${escHtml(p.title)}</option>`).join('');
  } catch { sel.innerHTML = '<option value="">Error loading</option>'; }
}

async function loadCityDropdown() {
  const sel = document.getElementById('ad-city-id');
  sel.innerHTML = '<option value="">Loading…</option>';
  try {
    const r = await api('GET','/api/cities/getAll');
    const list = r.ok ? (r.data.data||[]) : [];
    sel.innerHTML = '<option value="">Select city…</option>' + list.map(c=>`<option value="${c.id}">${escHtml(c.cityName)}</option>`).join('');
  } catch { sel.innerHTML = '<option value="">Error loading</option>'; }
}

/* ═══════════════════════════════════════════════════════
   APPLICATIONS
═══════════════════════════════════════════════════════ */
function switchAppTab(tab) {
  document.querySelectorAll('.custom-tab').forEach((t,i) => {
    t.classList.toggle('active', (i===0&&tab==='by-ad')||(i===1&&tab==='by-seeker'));
  });
  document.getElementById('app-tab-by-ad').classList.toggle('active', tab==='by-ad');
  document.getElementById('app-tab-by-seeker').classList.toggle('active', tab==='by-seeker');
}

async function loadApplicationsByAd() {
  const id = document.getElementById('app-ad-id').value;
  if (!id) { toast('Enter an Advertisement ID', 'warning'); return; }
  await loadApplications(`/api/applications/by-advertisement/${id}`, `Applications for Ad #${id}`);
}

async function loadApplicationsBySeeker() {
  const id = document.getElementById('app-seeker-id').value;
  if (!id) { toast('Enter a Job Seeker ID', 'warning'); return; }
  await loadApplications(`/api/applications/by-jobseeker/${id}`, `Applications by Seeker #${id}`);
}

async function loadApplications(endpoint, title) {
  document.getElementById('app-results-title').textContent = title;
  const tbody = document.getElementById('app-table-body');
  tbody.innerHTML = '<tr><td colspan="6"><div class="spinner-wrap"><div class="spinner-border"></div></div></td></tr>';
  try {
    const r = await api('GET', endpoint);
    if (r.ok) {
      const list = r.data.data || [];
      if (!list.length) { tbody.innerHTML = `<tr><td colspan="6">${emptyHtml('No applications found')}</td></tr>`; return; }
      tbody.innerHTML = list.map(a=>`
        <tr>
          <td class="text-muted">${a.id}</td>
          <td>${escHtml(a.jobTitle||'—')}</td>
          <td>${escHtml(a.employerCompanyName||'—')}</td>
          <td>${formatDateTime(a.applicationDate)}</td>
          <td><span class="badge-${(a.status||'').toLowerCase()}">${a.status||'—'}</span></td>
          <td>
            <button class="btn-sm-action" onclick="openUpdateStatus(${a.id}, '${a.status}')">
              <i class="bi bi-pencil"></i> Status
            </button>
          </td>
        </tr>`).join('');
    } else {
      tbody.innerHTML = errRow(6, r.data.message || 'Failed to load');
    }
  } catch(e) { tbody.innerHTML = errRow(6,'API error'); }
}

async function applyForJob() {
  const adId = document.getElementById('apply-ad-id').value;
  const seekerId = document.getElementById('apply-seeker-id').value;
  if (!adId||!seekerId) { toast('Enter both Advertisement ID and Job Seeker ID','warning'); return; }
  try {
    const r = await api('POST','/api/applications/apply', { jobAdvertisementId:+adId, jobSeekerId:+seekerId });
    if (r.ok && r.data.success) {
      toast('Application submitted!');
      document.getElementById('apply-ad-id').value = '';
      document.getElementById('apply-seeker-id').value = '';
    } else {
      toast(r.data.message || 'Could not apply.', 'error');
    }
  } catch(e) { toast('API error: '+e.message,'error'); }
}

function openUpdateStatus(appId, currentStatus) {
  document.getElementById('update-app-id').value = appId;
  document.getElementById('update-status-val').value = currentStatus;
  new bootstrap.Modal(document.getElementById('modal-update-status')).show();
}

async function submitStatusUpdate() {
  const appId = document.getElementById('update-app-id').value;
  const status = document.getElementById('update-status-val').value;
  try {
    const r = await api('POST','/api/applications/update-status', { applicationId:+appId, status });
    if (r.ok && r.data.success) {
      toast('Status updated!');
      bootstrap.Modal.getInstance(document.getElementById('modal-update-status')).hide();
    } else {
      toast(r.data.message || 'Update failed.','error');
    }
  } catch(e) { toast('API error: '+e.message,'error'); }
}

/* ═══════════════════════════════════════════════════════
   EMPLOYERS
═══════════════════════════════════════════════════════ */
async function loadEmployers() {
  const tbody = document.getElementById('emp-table-body');
  tbody.innerHTML = '<tr><td colspan="5"><div class="spinner-wrap"><div class="spinner-border"></div></div></td></tr>';
  try {
    const r = await api('GET','/api/employers/getAll');
    if (r.ok) {
      _cache.employers = r.data.data || [];
      _empFiltered = [..._cache.employers];
      renderEmployersTable(_empFiltered);
    } else {
      tbody.innerHTML = errRow(5, r.data.message||'Failed');
    }
  } catch(e) { toast('API error: '+e.message,'error'); tbody.innerHTML = errRow(5,'Cannot reach API'); }
}

function renderEmployersTable(list) {
  const tbody = document.getElementById('emp-table-body');
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="5">${emptyHtml('No employers registered yet')}</td></tr>`; return; }
  tbody.innerHTML = list.map(e=>`
    <tr>
      <td class="text-muted">${e.id}</td>
      <td><strong>${escHtml(e.companyName)}</strong></td>
      <td>${escHtml(e.email)}</td>
      <td>${escHtml(e.phoneNumber||'—')}</td>
      <td>${e.companyWebPage ? `<a href="${escHtml(e.companyWebPage)}" target="_blank" class="text-primary">${escHtml(e.companyWebPage)}</a>` : '—'}</td>
    </tr>`).join('');
}

function filterEmployers() {
  const q = document.getElementById('emp-search').value.toLowerCase();
  _empFiltered = _cache.employers.filter(e =>
    (e.companyName||'').toLowerCase().includes(q) || (e.email||'').toLowerCase().includes(q)
  );
  renderEmployersTable(_empFiltered);
}

async function registerEmployer() {
  const body = {
    companyName: document.getElementById('emp-company').value,
    companyWebPage: document.getElementById('emp-website').value,
    email: document.getElementById('emp-email').value,
    phoneNumber: document.getElementById('emp-phone').value,
    password: document.getElementById('emp-password').value,
    confirmPassword: document.getElementById('emp-confirm').value
  };
  if (!body.companyName||!body.email||!body.password) { toast('Fill in all required fields.','warning'); return; }
  if (body.password !== body.confirmPassword) { toast('Passwords do not match.','warning'); return; }
  try {
    const r = await api('POST','/api/employers/register', body);
    if (r.ok && r.data.success) {
      toast('Employer registered!');
      bootstrap.Modal.getInstance(document.getElementById('modal-add-employer')).hide();
      ['emp-company','emp-website','emp-email','emp-phone','emp-password','emp-confirm'].forEach(id=>document.getElementById(id).value='');
      loadEmployers();
      loadDashboard();
    } else {
      toast(r.data.message||'Registration failed.','error');
    }
  } catch(e) { toast('API error: '+e.message,'error'); }
}

/* ═══════════════════════════════════════════════════════
   JOB SEEKERS
═══════════════════════════════════════════════════════ */
async function loadSeekers() {
  const tbody = document.getElementById('seeker-table-body');
  tbody.innerHTML = '<tr><td colspan="5"><div class="spinner-wrap"><div class="spinner-border"></div></div></td></tr>';
  try {
    const r = await api('GET','/api/candidateController/getAll');
    if (r.ok) {
      _cache.seekers = r.data.data || [];
      _seekerFiltered = [..._cache.seekers];
      renderSeekersTable(_seekerFiltered);
    } else {
      tbody.innerHTML = errRow(5, r.data.message||'Failed');
    }
  } catch { tbody.innerHTML = errRow(5,'Cannot reach API'); }
}

function renderSeekersTable(list) {
  const tbody = document.getElementById('seeker-table-body');
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="5">${emptyHtml('No job seekers registered yet')}</td></tr>`; return; }
  tbody.innerHTML = list.map(s=>`
    <tr>
      <td class="text-muted">${s.id}</td>
      <td><strong>${escHtml(s.name)} ${escHtml(s.lastName)}</strong></td>
      <td>${escHtml(s.email)}</td>
      <td>${escHtml(s.nationalId)}</td>
      <td>${formatDate(s.birthDate)}</td>
    </tr>`).join('');
}

function filterSeekers() {
  const q = document.getElementById('seeker-search').value.toLowerCase();
  _seekerFiltered = _cache.seekers.filter(s =>
    (s.name+' '+s.lastName).toLowerCase().includes(q) || (s.email||'').toLowerCase().includes(q)
  );
  renderSeekersTable(_seekerFiltered);
}

async function registerSeeker() {
  const body = {
    name: document.getElementById('sk-fname').value,
    lastName: document.getElementById('sk-lname').value,
    nationalId: document.getElementById('sk-national-id').value,
    birthDate: document.getElementById('sk-birthdate').value,
    email: document.getElementById('sk-email').value,
    password: document.getElementById('sk-password').value,
    confirmPassword: document.getElementById('sk-confirm').value
  };
  if (!body.name||!body.lastName||!body.email||!body.password||!body.nationalId||!body.birthDate) {
    toast('Fill in all required fields.','warning'); return;
  }
  if (body.password !== body.confirmPassword) { toast('Passwords do not match.','warning'); return; }
  try {
    const r = await api('POST','/api/candidateController/register', body);
    if (r.ok && r.data.success) {
      toast('Job seeker registered!');
      bootstrap.Modal.getInstance(document.getElementById('modal-add-seeker')).hide();
      ['sk-fname','sk-lname','sk-national-id','sk-birthdate','sk-email','sk-password','sk-confirm'].forEach(id=>document.getElementById(id).value='');
      loadSeekers();
      loadDashboard();
    } else {
      toast(r.data.message||'Registration failed.','error');
    }
  } catch(e) { toast('API error: '+e.message,'error'); }
}

/* ═══════════════════════════════════════════════════════
   JOB POSITIONS
═══════════════════════════════════════════════════════ */
async function loadPositions() {
  const tbody = document.getElementById('pos-table-body');
  tbody.innerHTML = '<tr><td colspan="2"><div class="spinner-wrap"><div class="spinner-border"></div></div></td></tr>';
  try {
    const r = await api('GET','/api/jobPosition/getAll');
    if (r.ok) {
      _cache.positions = r.data.data || [];
      if (!_cache.positions.length) { tbody.innerHTML = `<tr><td colspan="2">${emptyHtml('No positions yet')}</td></tr>`; return; }
      tbody.innerHTML = _cache.positions.map(p=>`<tr><td class="text-muted">${p.id}</td><td>${escHtml(p.title)}</td></tr>`).join('');
    } else { tbody.innerHTML = errRow(2, r.data.message||'Failed'); }
  } catch { tbody.innerHTML = errRow(2,'Cannot reach API'); }
}

async function addJobPosition() {
  const title = document.getElementById('pos-title').value.trim();
  const inp = document.getElementById('pos-title');
  const err = document.getElementById('pos-title-err');
  if (!title) { inp.classList.add('is-invalid'); err.textContent='Title is required.'; return; }
  inp.classList.remove('is-invalid');
  try {
    const r = await api('POST','/api/jobPosition/add', { title });
    if (r.ok && r.data.success) {
      toast('Job position added!');
      inp.value = '';
      loadPositions();
      loadDashboard();
    } else {
      toast(r.data.message||'Failed to add.','error');
    }
  } catch(e) { toast('API error: '+e.message,'error'); }
}

/* ═══════════════════════════════════════════════════════
   CITIES
═══════════════════════════════════════════════════════ */
async function loadCities() {
  const tbody = document.getElementById('city-table-body');
  tbody.innerHTML = '<tr><td colspan="2"><div class="spinner-wrap"><div class="spinner-border"></div></div></td></tr>';
  try {
    const r = await api('GET','/api/cities/getAll');
    if (r.ok) {
      _cache.cities = r.data.data || [];
      if (!_cache.cities.length) { tbody.innerHTML = `<tr><td colspan="2">${emptyHtml('No cities added yet')}</td></tr>`; return; }
      tbody.innerHTML = _cache.cities.map(c=>`<tr><td class="text-muted">${c.id}</td><td>${escHtml(c.cityName)}</td></tr>`).join('');
    } else { tbody.innerHTML = errRow(2, r.data.message||'Failed'); }
  } catch { tbody.innerHTML = errRow(2,'Cannot reach API'); }
}

async function addCity() {
  const name = document.getElementById('city-name').value.trim();
  const inp = document.getElementById('city-name');
  const err = document.getElementById('city-name-err');
  if (!name) { inp.classList.add('is-invalid'); err.textContent='City name is required.'; return; }
  inp.classList.remove('is-invalid');
  try {
    const r = await api('POST','/api/cities/add', { cityName: name });
    if (r.ok && r.data.success) {
      toast('City added!');
      inp.value = '';
      loadCities();
      loadDashboard();
    } else {
      toast(r.data.message||'Failed.','error');
    }
  } catch(e) { toast('API error: '+e.message,'error'); }
}

/* ═══════════════════════════════════════════════════════
   HR EMPLOYEES
═══════════════════════════════════════════════════════ */
async function loadHrEmployees() {
  const tbody = document.getElementById('hr-table-body');
  tbody.innerHTML = '<tr><td colspan="3"><div class="spinner-wrap"><div class="spinner-border"></div></div></td></tr>';
  try {
    const r = await api('GET','/api/hrController/getAll/systemEmployee');
    if (r.ok) {
      const list = r.data.data || [];
      if (!list.length) { tbody.innerHTML = `<tr><td colspan="3">${emptyHtml('No HR employees added yet')}</td></tr>`; return; }
      tbody.innerHTML = list.map(h=>`<tr><td class="text-muted">${h.id}</td><td>${escHtml(h.name)}</td><td>${escHtml(h.lastName)}</td></tr>`).join('');
    } else { tbody.innerHTML = errRow(3, r.data.message||'Failed'); }
  } catch { tbody.innerHTML = errRow(3,'Cannot reach API'); }
}

async function addHrEmployee() {
  const name = document.getElementById('hr-fname').value.trim();
  const lastName = document.getElementById('hr-lname').value.trim();
  if (!name||!lastName) { toast('Fill in both name fields.','warning'); return; }
  try {
    const r = await api('POST','/api/hrController/add', { name, lastName });
    if (r.ok && r.data.success) {
      toast('HR Employee added!');
      document.getElementById('hr-fname').value = '';
      document.getElementById('hr-lname').value = '';
      loadHrEmployees();
    } else {
      toast(r.data.message||'Failed.','error');
    }
  } catch(e) { toast('API error: '+e.message,'error'); }
}

/* ═══════════════════════════════════════════════════════
   API EXPLORER
═══════════════════════════════════════════════════════ */
const ENDPOINTS = [
  {method:'GET',  path:'/api/cities/getAll',           desc:'List all cities'},
  {method:'POST', path:'/api/cities/add',              desc:'Add a new city',           body:'{"cityName":"Istanbul"}'},
  {method:'GET',  path:'/api/employers/getAll',        desc:'List all employers'},
  {method:'POST', path:'/api/employers/register',      desc:'Register employer',         body:'{"companyName":"ACME","companyWebPage":"https://acme.com","email":"hr@acme.com","phoneNumber":"+1234567890","password":"pass123","confirmPassword":"pass123"}'},
  {method:'GET',  path:'/api/candidateController/getAll', desc:'List all job seekers'},
  {method:'POST', path:'/api/candidateController/register', desc:'Register job seeker', body:'{"name":"Ali","lastName":"Yilmaz","nationalId":"12345678901","birthDate":"1995-05-15","email":"ali@mail.com","password":"pass123","confirmPassword":"pass123"}'},
  {method:'GET',  path:'/api/jobPosition/getAll',      desc:'List all job positions'},
  {method:'POST', path:'/api/jobPosition/add',         desc:'Add a job position',        body:'{"title":"Backend Developer"}'},
  {method:'GET',  path:'/api/jobPost/getAll',          desc:'List all job advertisements'},
  {method:'GET',  path:'/api/jobPost/active',          desc:'List active advertisements'},
  {method:'POST', path:'/api/jobPost/add',             desc:'Add job advertisement',     body:'{"jobPositionId":1,"cityId":1,"employerId":1,"description":"Looking for a Java developer with 2+ years experience.","openPositionCount":2,"minSalary":30000,"maxSalary":60000,"applicationDeadline":"2026-12-31"}'},
  {method:'POST', path:'/api/applications/apply',      desc:'Apply for a job',           body:'{"jobAdvertisementId":1,"jobSeekerId":1}'},
  {method:'GET',  path:'/api/applications/by-advertisement/1', desc:'Apps for advertisement #1'},
  {method:'GET',  path:'/api/applications/by-jobseeker/1',     desc:'Apps by seeker #1'},
  {method:'POST', path:'/api/applications/update-status', desc:'Update application status', body:'{"applicationId":1,"status":"ACCEPTED"}'},
  {method:'GET',  path:'/api/hrController/getAll/systemEmployee', desc:'List HR employees'},
  {method:'POST', path:'/api/hrController/add',        desc:'Add HR employee',           body:'{"name":"Seda","lastName":"Basaran"}'},
];

const METHOD_COLORS = { GET:'var(--success)', POST:'var(--primary)', PUT:'var(--warning)', DELETE:'var(--danger)' };

function initApiExplorer() {
  const el = document.getElementById('endpoint-list');
  el.innerHTML = `<div class="col-12"><div class="row g-2">${
    ENDPOINTS.map(e=>`
      <div class="col-md-6 col-lg-4">
        <div class="d-flex align-items-start gap-2 p-3" style="background:var(--bg);border:1px solid var(--border);border-radius:8px;cursor:pointer" onclick="fillRequest('${e.method}','${e.path}',${e.body?`'${e.body.replace(/'/g,"\\'")}' `:'null'})">
          <span style="background:${METHOD_COLORS[e.method]||'#666'};color:#fff;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:4px;flex-shrink:0">${e.method}</span>
          <div>
            <div style="font-size:11.5px;font-family:monospace;color:var(--ink)">${e.path}</div>
            <div style="font-size:11px;color:var(--slate);margin-top:2px">${e.desc}</div>
          </div>
        </div>
      </div>`).join('')
  }</div></div>`;
}

function fillRequest(method, path, body) {
  document.getElementById('req-method').value = method;
  document.getElementById('req-endpoint').value = path;
  if (body) {
    try { document.getElementById('req-body').value = JSON.stringify(JSON.parse(body), null, 2); }
    catch { document.getElementById('req-body').value = body; }
  } else {
    document.getElementById('req-body').value = '';
  }
}

async function sendRawRequest() {
  const method = document.getElementById('req-method').value;
  const endpoint = document.getElementById('req-endpoint').value;
  const bodyStr = document.getElementById('req-body').value.trim();
  const out = document.getElementById('response-output');
  const badge = document.getElementById('res-status-badge');

  if (!endpoint) { toast('Enter an endpoint path.','warning'); return; }

  out.textContent = 'Sending…';
  badge.textContent = '…'; badge.style.background = 'var(--slate)';

  let body = null;
  if (bodyStr) {
    try { body = JSON.parse(bodyStr); }
    catch { toast('Request body is not valid JSON.','warning'); return; }
  }

  try {
    const r = await api(method, endpoint, body);
    badge.textContent = r.status;
    badge.style.background = r.ok ? 'var(--success)' : 'var(--danger)';
    out.textContent = JSON.stringify(r.data, null, 2);
  } catch(e) {
    badge.textContent = 'ERR'; badge.style.background = 'var(--danger)';
    out.textContent = 'Error: ' + e.message;
  }
}

async function testConnection() {
  API_BASE = document.getElementById('api-base-url').value.trim();
  document.getElementById('api-base-display').textContent = API_BASE;
  try {
    const r = await api('GET','/api/cities/getAll');
    if (r.ok) {
      toast('Connection successful! API is reachable.');
      updateApiStatus(true);
    } else {
      toast(`Server responded with status ${r.status}.`,'warning');
    }
  } catch { toast('Could not reach the API. Check URL and CORS.','error'); updateApiStatus(false); }
}

function clearResponse() {
  document.getElementById('response-output').textContent = 'No response yet.';
  document.getElementById('res-status-badge').textContent = '—';
  document.getElementById('res-status-badge').style.background = 'var(--slate)';
}

/* ═══════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════ */
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB'); }
function formatDateTime(d) { if (!d) return '—'; return new Date(d).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}); }
function salaryRange(min, max) {
  if (!min && !max) return '—';
  if (min && max) return `${Number(min).toLocaleString()} – ${Number(max).toLocaleString()}`;
  if (min) return `From ${Number(min).toLocaleString()}`;
  return `Up to ${Number(max).toLocaleString()}`;
}
function errRow(cols, msg) {
  return `<tr><td colspan="${cols}"><div class="empty-state"><i class="bi bi-exclamation-triangle" style="color:var(--danger)"></i><p style="color:var(--danger)">${escHtml(msg)}</p></div></td></tr>`;
}
function emptyHtml(msg) {
  return `<div class="empty-state"><i class="bi bi-inbox"></i><p>${msg}</p></div>`;
}

/* ═══════════════════════════════════════════════════════════════════════
   ═══════════════════════════════════════════════════════════════════════
   UI-PREVIEW-ONLY MODULES (Employees, Departments, Leave Types, Apply
   Leave, Change Password). These are NOT wired to the Spring Boot API —
   the project has no backend support for them. Everything below lives in
   browser memory only, purely to demonstrate the requested screens.
   ═══════════════════════════════════════════════════════════════════════
═══════════════════════════════════════════════════════════════════════ */
let _demoIdSeq = { emp: 3, dept: 3, leaveType: 3, leaveReq: 2 };

let demoEmployees = [
  { id:1, fname:'Priya', lname:'Sharma', dept:'Engineering', role:'Frontend Developer', email:'priya.sharma@example.com' },
  { id:2, fname:'Rahul', lname:'Verma', dept:'Human Resources', role:'HR Executive', email:'rahul.verma@example.com' }
];
let demoDepartments = [
  { id:1, name:'Engineering', head:'Ananya Rao', count:1 },
  { id:2, name:'Human Resources', head:'Rahul Verma', count:1 }
];
let demoLeaveTypes = [
  { id:1, name:'Casual Leave', days:12 },
  { id:2, name:'Sick Leave', days:10 }
];
let demoLeaveRequests = [
  { id:1, employee:'Priya Sharma', type:'Casual Leave', from:'2026-07-20', to:'2026-07-22', status:'PENDING' }
];

/* ── Employees ── */
function renderDemoEmployees() {
  const tbody = document.getElementById('demo-emp-table-body');
  document.getElementById('demo-emp-count').textContent = `${demoEmployees.length} employee${demoEmployees.length===1?'':'s'}`;
  if (!demoEmployees.length) { tbody.innerHTML = `<tr><td colspan="6">${emptyHtml('No employees added yet')}</td></tr>`; return; }
  tbody.innerHTML = demoEmployees.map(e => `
    <tr>
      <td class="text-muted">${e.id}</td>
      <td><strong>${escHtml(e.fname)} ${escHtml(e.lname)}</strong></td>
      <td><span class="badge-soft-blue">${escHtml(e.dept)}</span></td>
      <td>${escHtml(e.role||'—')}</td>
      <td>${escHtml(e.email||'—')}</td>
      <td><button class="btn-sm-action danger" onclick="demoDeleteEmployee(${e.id})"><i class="bi bi-trash"></i> Remove</button></td>
    </tr>`).join('');
}
function demoAddEmployee() {
  const fname = document.getElementById('demo-emp-fname').value.trim();
  const lname = document.getElementById('demo-emp-lname').value.trim();
  const email = document.getElementById('demo-emp-email').value.trim();
  const dept = document.getElementById('demo-emp-dept').value;
  const role = document.getElementById('demo-emp-role').value.trim();
  if (!fname || !lname) { toast('First and last name are required.','warning'); return; }
  demoEmployees.push({ id: _demoIdSeq.emp++, fname, lname, dept, role, email });
  ['demo-emp-fname','demo-emp-lname','demo-emp-email','demo-emp-role'].forEach(id => document.getElementById(id).value = '');
  toast('Employee added (preview only).');
  renderDemoEmployees();
}
function demoDeleteEmployee(id) {
  demoEmployees = demoEmployees.filter(e => e.id !== id);
  toast('Employee removed (preview only).');
  renderDemoEmployees();
}

/* ── Departments ── */
function renderDemoDepartments() {
  const tbody = document.getElementById('demo-dept-table-body');
  if (!demoDepartments.length) { tbody.innerHTML = `<tr><td colspan="5">${emptyHtml('No departments added yet')}</td></tr>`; return; }
  tbody.innerHTML = demoDepartments.map(d => `
    <tr>
      <td class="text-muted">${d.id}</td>
      <td><strong>${escHtml(d.name)}</strong></td>
      <td>${escHtml(d.head||'—')}</td>
      <td>${d.count||0}</td>
      <td><button class="btn-sm-action danger" onclick="demoDeleteDepartment(${d.id})"><i class="bi bi-trash"></i> Remove</button></td>
    </tr>`).join('');
}
function demoAddDepartment() {
  const name = document.getElementById('demo-dept-name').value.trim();
  const head = document.getElementById('demo-dept-head').value.trim();
  if (!name) { toast('Department name is required.','warning'); return; }
  demoDepartments.push({ id: _demoIdSeq.dept++, name, head, count: 0 });
  ['demo-dept-name','demo-dept-head'].forEach(id => document.getElementById(id).value = '');
  toast('Department added (preview only).');
  renderDemoDepartments();
}
function demoDeleteDepartment(id) {
  demoDepartments = demoDepartments.filter(d => d.id !== id);
  toast('Department removed (preview only).');
  renderDemoDepartments();
}

/* ── Leave Types ── */
function renderDemoLeaveTypes() {
  const tbody = document.getElementById('demo-leavetype-table-body');
  if (!demoLeaveTypes.length) { tbody.innerHTML = `<tr><td colspan="4">${emptyHtml('No leave types added yet')}</td></tr>`; return; }
  tbody.innerHTML = demoLeaveTypes.map(lt => `
    <tr>
      <td class="text-muted">${lt.id}</td>
      <td><strong>${escHtml(lt.name)}</strong></td>
      <td>${lt.days}</td>
      <td><button class="btn-sm-action danger" onclick="demoDeleteLeaveType(${lt.id})"><i class="bi bi-trash"></i> Remove</button></td>
    </tr>`).join('');
}
function demoAddLeaveType() {
  const name = document.getElementById('demo-leavetype-name').value.trim();
  const days = document.getElementById('demo-leavetype-days').value;
  if (!name || !days) { toast('Fill in both fields.','warning'); return; }
  demoLeaveTypes.push({ id: _demoIdSeq.leaveType++, name, days: +days });
  ['demo-leavetype-name','demo-leavetype-days'].forEach(id => document.getElementById(id).value = '');
  toast('Leave type added (preview only).');
  renderDemoLeaveTypes();
}
function demoDeleteLeaveType(id) {
  demoLeaveTypes = demoLeaveTypes.filter(lt => lt.id !== id);
  toast('Leave type removed (preview only).');
  renderDemoLeaveTypes();
}

/* ── Apply Leave ── */
function populateDemoLeaveDropdowns() {
  const empSel = document.getElementById('demo-apply-employee');
  const typeSel = document.getElementById('demo-apply-type');
  empSel.innerHTML = '<option value="">Select employee…</option>' +
    demoEmployees.map(e => `<option value="${escHtml(e.fname+' '+e.lname)}">${escHtml(e.fname)} ${escHtml(e.lname)}</option>`).join('');
  typeSel.innerHTML = '<option value="">Select leave type…</option>' +
    demoLeaveTypes.map(lt => `<option value="${escHtml(lt.name)}">${escHtml(lt.name)}</option>`).join('');
}
function renderDemoLeaveRequests() {
  const tbody = document.getElementById('demo-leave-table-body');
  if (!demoLeaveRequests.length) { tbody.innerHTML = `<tr><td colspan="6">${emptyHtml('No leave requests yet')}</td></tr>`; return; }
  tbody.innerHTML = demoLeaveRequests.map(r => `
    <tr>
      <td class="text-muted">${r.id}</td>
      <td><strong>${escHtml(r.employee)}</strong></td>
      <td>${escHtml(r.type)}</td>
      <td>${formatDate(r.from)}</td>
      <td>${formatDate(r.to)}</td>
      <td><span class="badge-${r.status.toLowerCase()}">${r.status}</span></td>
    </tr>`).join('');
}
function demoApplyLeave() {
  const employee = document.getElementById('demo-apply-employee').value;
  const type = document.getElementById('demo-apply-type').value;
  const from = document.getElementById('demo-apply-from').value;
  const to = document.getElementById('demo-apply-to').value;
  if (!employee || !type || !from || !to) { toast('Fill in employee, type, and both dates.','warning'); return; }
  if (new Date(to) < new Date(from)) { toast('"To" date cannot be before "From" date.','warning'); return; }
  demoLeaveRequests.unshift({ id: _demoIdSeq.leaveReq++, employee, type, from, to, status: 'PENDING' });
  ['demo-apply-from','demo-apply-to','demo-apply-reason'].forEach(id => document.getElementById(id).value = '');
  toast('Leave request submitted (preview only).');
  renderDemoLeaveRequests();
}

/* ── Change Password ── */
function demoChangePassword() {
  const current = document.getElementById('demo-pw-current').value;
  const next = document.getElementById('demo-pw-new').value;
  const confirm = document.getElementById('demo-pw-confirm').value;
  if (!current || !next || !confirm) { toast('Fill in all three fields.','warning'); return; }
  if (next.length < 6) { toast('New password must be at least 6 characters.','warning'); return; }
  if (next !== confirm) { toast('New password and confirmation do not match.','warning'); return; }
  ['demo-pw-current','demo-pw-new','demo-pw-confirm'].forEach(id => document.getElementById(id).value = '');
  toast('Password updated (preview only — no backend to persist this).');
}

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
loadDashboard();
setInterval(() => {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  const id = activePage.id.replace('page-','');
  if (['dashboard','job-ads','employers','seekers','job-positions','cities','hr-employees'].includes(id)) {
    onPageLoad(id);
  }
}, 5000);
