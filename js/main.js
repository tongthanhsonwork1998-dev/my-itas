// ==========================================
// DỮ LIỆU TUYỂN DỤNG
// Từ nay bạn chỉ cần thêm/sửa/xóa ở phần này
// ==========================================
let jobData = [];

// Thay ID file Google Sheets của bạn vào đây
const SPREADSHEET_ID = '1sxnnQzXeySoGgCkVtg3vP8cPAlMcXJfoDmn76G3Lz1E'; 

// ==========================================
// LOGIC HIỂN THỊ LÊN GIAO DIỆN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    fetchJobsFromGoogleSheet();
});

// 1. Hàm gọi API từ Google Sheets để lấy dữ liệu
function fetchJobsFromGoogleSheet() {
    const container = document.getElementById('job-list-container');
    // Hiển thị loading trong lúc chờ Google trả kết quả
    container.innerHTML = '<div class="p-5 text-center text-muted"><div class="spinner-border text-accent mb-3" role="status"></div><p>Đang tải danh sách công việc...</p></div>';

    if(SPREADSHEET_ID === 'THAY_ID_CUA_BAN_VAO_DAY' || SPREADSHEET_ID === '') {
        container.innerHTML = '<div class="p-4 text-center text-danger border rounded bg-white">Vui lòng cập nhật SPREADSHEET_ID trong code.</div>';
        return;
    }

    // Sử dụng phương pháp JSONP (chèn thẻ script) để bypass hoàn toàn lỗi CORS
    const script = document.createElement('script');
    script.src = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json;responseHandler:handleGoogleSheetData`;
    
    script.onerror = function() {
        container.innerHTML = '<div class="p-4 text-center text-danger border rounded bg-white">Không thể kết nối đến Google Sheets. Vui lòng kiểm tra lại ID hoặc quyền chia sẻ của file.</div>';
    };
    document.body.appendChild(script);
}

// Hàm callback được Google gọi sau khi tải xong dữ liệu
function handleGoogleSheetData(data) {
    const container = document.getElementById('job-list-container');
    try {
        const formatText = (text) => {
            if (!text) return '<i class="text-muted">Chưa có thông tin.</i>';
            let str = text.toString();
            if (str.includes('<') && str.includes('>')) return str; 
            return '<ul class="ps-3 mb-0">' + str.split('\n').filter(l => l.trim() !== '').map(l => `<li class="mb-2">${l.replace(/^[-+*]\s*/, '').trim()}</li>`).join('') + '</ul>';
        };

        const formatSalary = (val) => {
            if (!val) return 'Thỏa thuận';
            let str = val.toString();
            str = str.replace(/(\d)\s*-\s*(\d)/g, '$1 - $2');
            let formatted = str.replace(/\d{4,}/g, (match) => Number(match).toLocaleString('vi-VN'));
            if (!formatted.toLowerCase().includes('vnd') && !formatted.toLowerCase().includes('vnđ')) {
                formatted += ' VNĐ';
            }
            return formatted;
        };

        jobData = data.table.rows.map(row => {
            return {
                id: row.c[0] && row.c[0].v ? row.c[0].v : Math.random(),
                title: row.c[1] && row.c[1].v ? row.c[1].v : '',
                status: row.c[2] && row.c[2].v ? row.c[2].v : 'Đang tuyển',
                type: row.c[3] && row.c[3].v ? row.c[3].v : 'Toàn thời gian',
                location: row.c[4] && row.c[4].v ? row.c[4].v : 'Chưa cập nhật',
                salary: formatSalary(row.c[5] ? (row.c[5].f || row.c[5].v) : ''),
                desc: formatText(row.c[7] && row.c[7].v ? row.c[7].v : ''),
                req: formatText(row.c[8] && row.c[8].v ? row.c[8].v : ''),
                ben: formatText(row.c[9] && row.c[9].v ? row.c[9].v : '')
            };
        }).filter(job => job.title !== ''); 

        renderJobs();
    } catch (error) {
        console.error('Lỗi xử lý dữ liệu:', error);
        container.innerHTML = '<div class="p-4 text-center text-danger border rounded bg-white">Đã xảy ra lỗi khi đọc dữ liệu. Vui lòng kiểm tra lại định dạng file Google Sheet.</div>';
    }
}

// Vẽ danh sách công việc ra HTML
function renderJobs() {
    const container = document.getElementById('job-list-container');
    if (jobData.length === 0) {
        container.innerHTML = '<div class="p-4 text-center text-muted border rounded bg-white">Hiện tại công ty chưa có vị trí nào đang tuyển.</div>';
        return;
    }

    let htmlContent = '';
    jobData.forEach(job => {
        htmlContent += `
            <div class="list-group-item list-group-item-action d-flex flex-column flex-md-row justify-content-between align-items-md-center p-4 border-bottom">
                <div class="mb-3 mb-md-0">
                    <h5 class="fw-bold mb-2 text-primary-dark">${job.title}</h5>
                    <span class="badge bg-accent-soft text-accent mb-2 px-3 py-2 rounded-pill">${job.status}</span>
                    <p class="text-muted small mb-0">
                        <i class="bi bi-geo-alt me-1"></i> ${job.location} &nbsp;|&nbsp; 
                        <i class="bi bi-cash me-1"></i> <span class="text-accent fw-bold">${job.salary}</span>
                    </p>
                </div>
                <button class="btn btn-job-detail px-4 rounded-pill stretched-link" 
                        data-bs-toggle="offcanvas" 
                        data-bs-target="#jobDetailsOffcanvas"
                        onclick="updateOffcanvas('${job.id}')">
                    Xem chi tiết
                </button>
            </div>
        `;
    });
    container.innerHTML = htmlContent;
}

// Hàm cập nhật nội dung Offcanvas
function updateOffcanvas(jobId) {
    const job = jobData.find(j => j.id.toString() === jobId.toString());
    if (!job) return;

    document.getElementById('oc-title').innerText = job.title;
    document.getElementById('oc-type').innerText = job.type;
    document.getElementById('oc-location').innerText = job.location;
    document.getElementById('oc-salary').innerText = job.salary;
    
    document.getElementById('oc-desc').innerHTML = job.desc;
    document.getElementById('oc-req').innerHTML = job.req;
    document.getElementById('oc-ben').innerHTML = job.ben;
}

// Hàm xử lý khi bấm "Ứng Tuyển Ngay"
function prepareApplicationForm() {
    const jobTitle = document.getElementById('oc-title').innerText;
    const messageBox = document.getElementById('message');
    
    messageBox.value = `Xin chào Ban Tuyển Dụng,\n\nTôi rất quan tâm và mong muốn ứng tuyển vào vị trí: ${jobTitle}.\n\n[Bạn có thể dán link Google Drive chứa CV của bạn tại đây, hoặc để lại số điện thoại để chúng tôi liên hệ...]`;
    
    setTimeout(() => {
        messageBox.focus();
    }, 600);
}