// عناصر DOM
const instituteSelectContainer = document.getElementById('instituteSelectContainer');
const divisionSelectContainer = document.getElementById('divisionSelectContainer');
const filterInstituteHidden = document.getElementById('filterInstituteHidden');
const filterDivisionHidden = document.getElementById('filterDivisionHidden');
const teacherCodeInput = document.getElementById('teacherCode');
const searchButton = document.getElementById('searchButton');
const resultsContainer = document.getElementById('resultsContainer');

let jsonData = [];
let headers = {};

// بيانات CSV لكل أستاذ ومعهد
const csvFiles = {
    '0932863150': {
        'اليمان': './data/data_samer_yaman.csv',
        'الإدريسي': './data/data_samer_idrisi.csv',
        'الخليل': './data/data_samer_khalil.csv',
        'خطوة': './data/data_samer_khatwa.csv',
    },
    '0933183934': {
        'اليمان': './data/data_abdullah_yaman.csv',
    },
    '0944447586': {
        'اليمان': './data/data_rami_yaman.csv',
        'الإدريسي': './data/data_rami_idrisi.csv',
        'الخليل': './data/data_rami_khalil.csv',
    },
};

// بيانات المعاهد والشعب
const teacherData = {
    '0932863150': {
        name: 'سامر محاحي',
        divisions: {
            'اليمان': ['شعبة اولى إناث', 'شعبة ثالثة إناث', 'شعبة رابعة إناث', 'شعبة اولى ذكور', 'شعبة ثانية ذكور', 'شعبة ثالثة ذكور'],
            'الإدريسي': ['شعبة اولى إناث', 'شعبة اولى ذكور'],
            'الخليل': ['شعبة اولى إناث', 'شعبة ثانية إناث', 'شعبة رابعة إناث', 'شعبة اولى ذكور'],
            'خطوة': ['الشعبة 1']
        }
    },
    '0933183934': {
        name: 'عبد الله سلطجي',
        divisions: {
            'اليمان': ['شعبة ثانية إناث', 'شعبة خامسة إناث']
        }
    },
    '0944447586': {
        name: 'رامي حلاق',
        divisions: {
            'اليمان': ['شعبة اولى أدبي إناث', 'شعبة ثانية إناث أدبي', 'شعبة ثالثة ذكور أدبي'],
            'الإدريسي': ['شعبة ثانية إناث', 'الشعبة اولى أدبي'],
            'الخليل': ['شعبة ثالثة إناث', 'شعبة ثانية ذكور']
        }
    },
};

// تهيئة القوائم المنسدلة
function initializeCustomSelect(container, hiddenInput) {
    const selectedOptionDiv = container.querySelector('.selected-option');
    const optionsList = container.querySelector('.options');

    // عند الضغط على القائمة لعرض الخيارات
    selectedOptionDiv.addEventListener('click', () => {
        optionsList.style.display = optionsList.style.display === 'block' ? 'none' : 'block';
    });

    // عند اختيار خيار
    optionsList.addEventListener('click', (event) => {
        const target = event.target.closest('li');
        if (target) {
            hiddenInput.value = target.dataset.value;
            selectedOptionDiv.innerHTML = `${target.innerHTML} <i class="fas fa-chevron-down"></i>`;
            optionsList.style.display = 'none';
        }
    });

    // إخفاء القائمة عند النقر خارجها
    document.addEventListener('click', (event) => {
        if (!container.contains(event.target)) {
            optionsList.style.display = 'none';
        }
    });
}

// تحديث الشعب عند تغيير المعهد
function updateDivisions(teacherCode, institute) {
    const divisions = teacherData[teacherCode]?.divisions[institute] || [];
    const divisionOptionsList = divisionSelectContainer.querySelector('.options');
    const selectedOptionDiv = divisionSelectContainer.querySelector('.selected-option');

    // إعادة تهيئة الخيارات
    divisionOptionsList.innerHTML = ''; // مسح الخيارات السابقة
    selectedOptionDiv.innerHTML = 'اختر الشعبة <i class="fas fa-chevron-down"></i>';
    filterDivisionHidden.value = '';

    // تعطيل القائمة إذا لم تكن هناك شعب متاحة
    if (divisions.length === 0) {
        divisionSelectContainer.style.pointerEvents = 'none';
        divisionOptionsList.style.display = 'none';
    } else {
        divisionSelectContainer.style.pointerEvents = 'auto';
        divisions.forEach((division) => {
            const li = document.createElement('li');
            li.dataset.value = division;
            li.innerHTML = `<i class="fas fa-users"></i> ${division}`;
            divisionOptionsList.appendChild(li);
        });
    }
}

// تحميل البيانات من ملف CSV
function loadData(teacherCode, institute, division) {
    const filePath = csvFiles[teacherCode]?.[institute];
    if (!filePath) {
        resultsContainer.innerHTML = '<p class="text-center text-danger1">لا توجد بيانات لهذا المعهد ورمز الأستاذ.</p>';
        return;
    }

    resultsContainer.innerHTML = '<p class="text-center text-primary1">جاري تحميل البيانات...</p>';

    fetch(filePath)
        .then(response => response.text())
        .then((csv) => {
            const lines = csv.split('\n');
            headers = lines[0].split(',').map(h => h.trim());
            jsonData = lines.slice(1)
                .map(line => line.split(',').map(item => item.trim()))
                .filter(row => row.length === headers.length && row.some(cell => cell !== ""));

            displayResults(teacherCode, division); // عرض النتائج بعد التحميل
        })
        .catch(() => {
            resultsContainer.innerHTML = '<p class="text-center text-danger1">حدث خطأ أثناء تحميل البيانات.</p>';
        });
}

// عرض النتائج في جدول مع تنسيق أفضل
function displayResults(teacherCode, division) {
    setTimeout(() => {
        if (!jsonData.length || !division) {
            resultsContainer.innerHTML = '<p class="text-center text-warning1">يرجى تحديد الشعبة للبحث عنها.</p>';
            return;
        }

        const filteredData = jsonData.filter(row => row[headers.indexOf('الشعبة')] === division);
        if (!filteredData.length) {
            resultsContainer.innerHTML = `<p class="text-center text-muted1">لا توجد نتائج للشعبة ${division}.</p>`;
            return;
        }

        const table = document.createElement('table');
        table.classList.add('table', 'table-striped', 'table-bordered');

        const headerRow = document.createElement('tr');
        const selectedHeaders = ['رقم الاكتتاب', 'الاسم', 'العلامة']; // الأعمدة المطلوبة

        selectedHeaders.forEach((headerName) => {
            const th = document.createElement('th');
            th.textContent = headerName;
            th.style.textAlign = 'center';
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        filteredData.forEach((row) => {
            const tr = document.createElement('tr');

            const studentIndex = headers.indexOf('رقم الاكتتاب');
            const nameIndex = headers.indexOf('الاسم');
            const gradeIndex = headers.indexOf('العلامة');

            const tdStudent = document.createElement('td');
            tdStudent.textContent = row[studentIndex];
            tdStudent.style.textAlign = 'center';
            tr.appendChild(tdStudent);

            const tdName = document.createElement('td');
            tdName.textContent = row[nameIndex];
            tdName.style.textAlign = 'center';
            tr.appendChild(tdName);

            const tdGrade = document.createElement('td');
            tdGrade.textContent = row[gradeIndex];
            tdGrade.style.textAlign = 'center';
            tr.appendChild(tdGrade);

            table.appendChild(tr);
        });

        resultsContainer.innerHTML = `<h3 class="text-center" style="color: black; margin: 20px 0;">نتائج الأستاذ ${teacherData[teacherCode].name}</h3>`;
        resultsContainer.appendChild(table);
    }, 5000); // تأخير زمني بمقدار 5 ثوانٍ
}

// تهيئة القوائم
initializeCustomSelect(instituteSelectContainer, filterInstituteHidden);
initializeCustomSelect(divisionSelectContainer, filterDivisionHidden);

// متابعة التغييرات في قائمة المعاهد
instituteSelectContainer.addEventListener('click', () => {
    const selectedInstitute = filterInstituteHidden.value;
    const teacherCode = teacherCodeInput.value.trim();
    if (teacherCode && selectedInstitute) {
        updateDivisions(teacherCode, selectedInstitute);
    }
});

// البحث وعرض النتائج
searchButton.addEventListener('click', () => {
    const teacherCode = teacherCodeInput.value.trim();
    const institute = filterInstituteHidden.value;
    const division = filterDivisionHidden.value;

    if (!teacherCode || !institute || !division) {
        resultsContainer.innerHTML = '<p class="text-center text-warning1">الرجاء تعبئة جميع الحقول.</p>';
        return;
    }

    loadData(teacherCode, institute, division);
});
