let produtos = JSON.parse(localStorage.getItem('produtos')) || [
    { nome: 'Heineken', preco: 18, icon: 'fas fa-beer-mug-empty' },
    { nome: 'Original', preco: 15, icon: 'fas fa-beer-mug-empty' },
    { nome: 'Brahma', preco: 12, icon: 'fas fa-beer-mug-empty' },
    { nome: 'Água', preco: 3, icon: 'fas fa-glass-water' },
    { nome: 'Refrigerante lata', preco: 3, icon: 'fas fa-can-cola' },
    { nome: 'Refrigerante 2L', preco: 5, icon: 'fas fa-bottle-water' },
    { nome: 'Gatorade', preco: 15, icon: 'fas fa-bottle-water' },
    { nome: 'Pastel', preco: 9, icon: 'fas fa-bread-slice' },
    { nome: 'Batata (300g)', preco: 15, icon: 'fas fa-bacon' }
];

const DOM = {
    clock: document.getElementById('clock'),
    totalDebt: document.getElementById('totalDebt'),
    addComanda: document.getElementById('addComanda'),
    emptyMessage: document.getElementById('emptyMessage'),
    openComandas: document.getElementById('openComandas'),
    toast: document.getElementById('toast'),
    container: document.getElementById('container'),
    popupOverlay: document.getElementById('popupOverlay'),
    popup: document.getElementById('popup'),
    popupTitle: document.getElementById('popupTitle'),
    popupContent: document.getElementById('popupContent'),
    popupTableBody: document.getElementById('popupTableBody'),
    popupTotal: document.getElementById('popupTotal'),
    lockBtn: document.getElementById('lockBtn'),
    lockScreen: document.getElementById('lockScreen'),
    lockForm: document.getElementById('lockForm'),
    lockPassword: document.getElementById('lockPassword')
};

const formatCurrency = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const updateClock = () => DOM.clock.innerText = new Date().toLocaleTimeString('pt-BR', { hour12: false });

const showToast = (message) => {
    DOM.toast.innerText = message;
    DOM.toast.classList.add('show');
    setTimeout(() => DOM.toast.classList.remove('show'), 2000);
};

const updateTotalDebt = () => {
    const totalDebt = Array.from(document.querySelectorAll('.comanda .total'))
        .reduce((sum, el) => sum + (parseFloat(el.innerText.replace(/[^\d,.]/g, '').replace(',', '.')) || 0), 0);
    DOM.totalDebt.innerText = `Total: ${formatCurrency(totalDebt)}`;
};

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const salvarComandas = () => {
    const comandas = {};
    document.querySelectorAll('.comanda').forEach(c => {
        const id = c.id.split('-')[1];
        const customerNameInput = document.getElementById(`customerName-${id}`);
        const taxaInput = document.getElementById(`taxa-${id}`);
        const descontoInput = document.getElementById(`desconto-${id}`);
        comandas[id] = {
            nome: customerNameInput?.value || '',
            quantidades: Array.from(c.querySelectorAll('.quantidade')).map(i => parseInt(i.value) || 0),
            taxa: parseFloat(taxaInput?.value) || 0,
            desconto: parseFloat(descontoInput?.value) || 0,
            expanded: c.classList.contains('expanded'),
            createdAt: comandas[id]?.createdAt || new Date().toISOString()
        };
    });
    try {
        localStorage.setItem('comandas', JSON.stringify(comandas));
        console.log('Comandas salvas:', comandas);
    } catch (error) {
        console.error('Erro ao salvar comandas:', error);
        showToast('Erro ao salvar comandas.');
    }
};

const salvarComandasDebounced = debounce(salvarComandas, 300);

const atualizarTotal = debounce((comandaId) => {
    const comanda = document.getElementById(`comanda-${comandaId}`);
    if (!comanda) return;
    const quantidades = comanda.querySelectorAll('.quantidade');
    const totais = comanda.querySelectorAll('.preco-total');
    const taxaInput = comanda.querySelector(`#taxa-${comandaId}`);
    const descontoInput = comanda.querySelector(`#desconto-${comandaId}`);
    let total = 0;

    quantidades.forEach((input, i) => {
        let qty = Math.max(0, parseInt(input.value) || 0);
        if (qty < 0) showToast('Quantidade negativa ajustada para 0');
        input.value = qty;
        const subtotal = qty * produtos[i].preco;
        totais[i].innerText = formatCurrency(subtotal);
        total += subtotal;
    });

    const taxa = parseFloat(taxaInput.value) || 0;
    const desconto = parseFloat(descontoInput.value) || 0;
    total = total - desconto + taxa;

    const totalElement = document.getElementById(`total-${comandaId}`);
    if (totalElement) {
        totalElement.innerText = `Total: ${formatCurrency(total)}`;
    }

    const shareBtn = document.getElementById(`shareBtn-${comandaId}`);
    if (shareBtn) {
        shareBtn.classList.toggle('hidden', total === 0);
    }

    salvarComandasDebounced();
    updateTotalDebt();

    const isExpanded = comanda.classList.contains('expanded');
    const items = comanda.querySelectorAll('.item');
    items.forEach((item, i) => {
        item.classList.toggle('hidden', !isExpanded && i >= 4);
    });
}, 300);

const atualizarTotalPopup = () => {
    const quantidades = DOM.popupContent.querySelectorAll('.quantidade');
    const nameInput = DOM.popup.querySelector('.customer-name');
    const submitBtn = DOM.popupContent.querySelector('.submit-btn');
    const isNameFilled = nameInput && nameInput.value.trim() !== '';
    const hasProducts = Array.from(quantidades).some(input => parseInt(input.value) > 0);
    if (submitBtn) {
        submitBtn.disabled = !(isNameFilled && hasProducts);
        submitBtn.style.background = isNameFilled && hasProducts 
            ? 'linear-gradient(135deg, #d32f2f, #b71c1c)' 
            : '#cccccc';
    }
};

const toggleExpand = (comandaId) => {
    const comanda = document.getElementById(`comanda-${comandaId}`);
    if (!comanda) return;
    const expandBtn = document.getElementById(`expandBtn-${comandaId}`);
    if (!expandBtn) return;

    const isExpanded = comanda.classList.toggle('expanded');
    expandBtn.querySelector('i').className = isExpanded ? 'fas fa-compress' : 'fas fa-expand';

    const items = comanda.querySelectorAll('.item');
    items.forEach((item, i) => {
        item.classList.toggle('hidden', !isExpanded && i >= 4);
    });

    atualizarTotal(comandaId);
    salvarComandasDebounced();
};

const closePopup = () => {
    DOM.popupOverlay.classList.remove('active');
    DOM.popup.classList.remove('popup-add-comanda');
    DOM.popupContent.innerHTML = '';
    DOM.popupTableBody.innerHTML = '';
    DOM.popupTotal.innerText = '';
    DOM.popupTotal.style.display = 'none';
};

const generatePDF = async (comandaId) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');

    let logoAdded = false;
    try {
        const logoUrl = 'imagens/bangu.png';
        const logoImg = new Image();
        logoImg.crossOrigin = "Anonymous";
        logoImg.src = logoUrl;

        await new Promise((resolve) => {
            logoImg.onload = () => {
                doc.setFillColor(255, 255, 255);
                doc.rect(10, 10, 30, 30, 'F');
                doc.addImage(logoImg, 'PNG', 10, 10, 30, 30);
                logoAdded = true;
                resolve();
            };
            logoImg.onerror = () => {
                console.error('Erro ao carregar o logo "bangu.png".');
                showToast('Erro ao carregar o logo.');
                resolve();
            };
        });
    } catch (error) {
        console.error('Erro ao processar o logo:', error);
    }

    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Boteco do Zé', logoAdded ? 45 : 10, 30);

    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(10, 45, 200, 45);

    const tableBody = DOM.popupTableBody.querySelector('table');
    if (!tableBody || tableBody.rows.length <= 1) {
        showToast('Nenhum item consumido para exibir no PDF.');
        doc.setFontSize(14);
        doc.setTextColor(255, 0, 0);
        doc.text('Nenhum item consumido.', 10, 55);
        return null;
    }

    let popupHeight = 0;
    try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const canvas = await html2canvas(tableBody, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        popupHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(imgData, 'PNG', 10, 55, imgWidth, popupHeight);
    } catch (error) {
        console.error('Erro ao capturar a tabela:', error);
        showToast('Erro ao capturar os itens da comanda.');
        return null;
    }

    const customerName = document.getElementById(`customerName-${comandaId}`)?.value || 'Cliente';
    const pixMessageY = 55 + popupHeight + 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Comanda de: ${customerName}`, 10, pixMessageY);
    doc.text('Pague via Pix para Boteco do Zé:', 10, pixMessageY + 10);
    doc.setFontSize(12);
    doc.text('Chave Pix: (48) 99636-8579', 10, pixMessageY + 20);

    return doc;
};

const shareComanda = async (comandaId) => {
    const comanda = document.getElementById(`comanda-${comandaId}`);
    if (!comanda) return;

    const customerName = comanda.querySelector(`#customerName-${comandaId}`)?.value || 'Cliente';
    const quantidades = Array.from(comanda.querySelectorAll('.quantidade')).map(input => input.value);
    const taxa = parseFloat(comanda.querySelector(`#taxa-${comandaId}`).value) || 0;
    const desconto = parseFloat(comanda.querySelector(`#desconto-${comandaId}`).value) || 0;

    DOM.popup.classList.remove('popup-add-comanda');
    DOM.popupTitle.innerHTML = `<i class="fas fa-file-alt"></i> Comanda - ${customerName}`;
    DOM.popupTableBody.innerHTML = `
        <table class="popup-table">
            <tr>
                <th scope="col">Produto</th>
                <th scope="col">Preço</th>
                <th scope="col">Qtd</th>
                <th scope="col">Total</th>
            </tr>
            ${produtos.map((p, i) => {
                const qty = parseInt(quantidades[i]) || 0;
                if (qty === 0) return '';
                const subtotal = qty * p.preco;
                return `
                    <tr>
                        <td>${p.nome}</td>
                        <td>${formatCurrency(p.preco)}</td>
                        <td>${qty}</td>
                        <td>${formatCurrency(subtotal)}</td>
                    </tr>
                `;
            }).join('')}
            ${desconto > 0 ? `
                <tr>
                    <td colspan="3">Desconto</td>
                    <td>-${formatCurrency(desconto)}</td>
                </tr>
            ` : ''}
            ${taxa > 0 ? `
                <tr>
                    <td colspan="3">Taxa</td>
                    <td>${formatCurrency(taxa)}</td>
                </tr>
            ` : ''}
        </table>
    `;
    DOM.popupContent.innerHTML = `
        <div class="buttons">
            <button class="share-btn" id="downloadBtn-${comandaId}" title="Baixar PDF"><i class="fas fa-download"></i></button>
            <button class="share-btn" id="shareGenericBtn-${comandaId}" title="Compartilhar"><i class="fas fa-share-alt"></i></button>
        </div>
    `;
    DOM.popupOverlay.classList.add('active');

    const total = quantidades.reduce((sum, qty, i) => sum + (parseInt(qty) || 0) * produtos[i].preco, 0) - desconto + taxa;
    DOM.popupTotal.innerText = `Total: ${formatCurrency(total)}`;
    DOM.popupTotal.style.display = 'block';
    DOM.popupTotal.style.background = '#ffffff';
    DOM.popupTotal.style.color = '#333333';
    DOM.popupTotal.style.padding = '10px 20px';
    DOM.popupTotal.style.margin = '10px 0';
    DOM.popupTotal.style.borderRadius = '8px';
    DOM.popupTotal.style.border = '2px solid #d32f2f';
    DOM.popupTotal.style.fontWeight = 'bold';
    DOM.popupTotal.style.fontSize = '18px';
    DOM.popupTotal.style.textAlign = 'center';
    DOM.popupTotal.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

    const downloadBtn = document.getElementById(`downloadBtn-${comandaId}`);
    const shareGenericBtn = document.getElementById(`shareGenericBtn-${comandaId}`);

    downloadBtn.addEventListener('click', async () => {
        showToast('Gerando PDF...');
        const doc = await generatePDF(comandaId);
        if (doc) {
            try {
                const pdfBlob = doc.output('blob');
                const url = window.URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `comanda_${comandaId}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
                showToast('PDF baixado com sucesso!');
            } catch (error) {
                console.error('Erro ao baixar o PDF:', error);
                showToast('Erro ao baixar o PDF.');
            }
        }
        closePopup();
    });

    shareGenericBtn.addEventListener('click', async () => {
        showToast('Preparando para compartilhamento...');
        const doc = await generatePDF(comandaId);
        if (doc) {
            try {
                const pdfBlob = doc.output('blob');
                const file = new File([pdfBlob], `comanda_${comandaId}.pdf`, { type: 'application/pdf' });
                const message = `Comanda de ${customerName} - Boteco do Zé`;
                if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: message,
                        text: 'Confira a comanda do Boteco do Zé!'
                    });
                    showToast('Comanda compartilhada!');
                } else {
                    const url = window.URL.createObjectURL(pdfBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `comanda_${comandaId}.pdf`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    showToast('PDF baixado. Compartilhe manualmente.');
                }
            } catch (error) {
                console.error('Erro ao compartilhar:', error);
                showToast('Erro ao compartilhar. Tente baixar e enviar manualmente.');
            }
        }
        closePopup();
    });
};

const removeComanda = (id) => {
    const comanda = document.getElementById(`comanda-${id}`);
    if (!comanda) return;
    comanda.remove();
    reorganizarComandas();
    salvarComandasDebounced();
    updateTotalDebt();
    showToast('Comanda fechada!');
};

const createComanda = (id, nome = '', quantidades = [], desconto = 0, taxa = 0) => {
    const comanda = document.createElement('div');
    comanda.className = 'comanda';
    comanda.id = `comanda-${id}`;
    comanda.innerHTML = `
        <div class="comanda-header">
            <div class="comanda-header-left">
                <label for="customerName-${id}">Nome:</label>
                <input type="text" id="customerName-${id}" placeholder="Digite o nome do cliente" value="${nome}">
            </div>
            <button class="remove-btn" aria-label="Remover Comanda">X</button>
        </div>
        <table>
            <tr><th scope="col">Produto</th><th scope="col">Qtd</th><th scope="col">Total</th></tr>
            ${produtos.map((p, i) => `
                <tr class="item${i >= 4 ? ' hidden' : ''}">
                    <td title="Preço: ${formatCurrency(p.preco)}">${p.nome}</td>
                    <td><input type="number" class="quantidade" min="0" value="${quantidades[i] || 0}"></td>
                    <td class="preco-total">${formatCurrency((quantidades[i] || 0) * p.preco)}</td>
                </tr>
            `).join('')}
        </table>
        <div class="cash-input-container" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <label for="taxa-${id}" style="font-size: 14px;">Taxa (R$):</label>
                <input type="number" id="taxa-${id}" step="0.01" min="0" value="${taxa}">
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <label for="desconto-${id}" style="font-size: 14px;">Desconto (R$):</label>
                <input type="number" id="desconto-${id}" step="0.01" min="0" value="${desconto}">
            </div>
        </div>
        <div class="footer">
            <div class="buttons">
                <button id="expandBtn-${id}" class="expand-btn" title="Expandir/Recolher Comanda" tabindex="0"><i class="fas fa-expand"></i></button>
                <button id="shareBtn-${id}" class="share-btn${quantidades.reduce((sum, qty) => sum + (parseInt(qty) || 0), 0) === 0 && desconto === 0 && taxa === 0 ? ' hidden' : ''}" title="Compartilhar Comanda" tabindex="0"><i class="fas fa-share-alt"></i></button>
            </div>
            <div class="socio-container">
                <div class="total" id="total-${id}">Total: ${formatCurrency(quantidades.reduce((sum, qty, i) => sum + (parseInt(qty) || 0) * produtos[i].preco, 0) - desconto + taxa)}</div>
            </div>
        </div>
    `;

    const expandBtn = comanda.querySelector(`#expandBtn-${id}`);
    const shareBtn = comanda.querySelector(`#shareBtn-${id}`);
    const removeBtn = comanda.querySelector('.remove-btn');

    if (expandBtn) {
        expandBtn.addEventListener('click', () => toggleExpand(id));
        expandBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleExpand(id);
            }
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', () => shareComanda(id));
        shareBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                shareComanda(id);
            }
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', () => removeComanda(id));
    }

    comanda.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', () => atualizarTotal(id));
    });

    const customerNameInput = comanda.querySelector(`#customerName-${id}`);
    if (customerNameInput) {
        customerNameInput.addEventListener('input', salvarComandasDebounced);
    }

    return comanda;
};

const getOrCreateRow = (index, container) => {
    const rowId = `row${index + 1}`;
    let row = container.querySelector(`#${rowId}`);
    if (!row) {
        row = document.createElement('div');
        row.className = 'row';
        row.id = rowId;
        container.appendChild(row);
    }
    return row;
};

const reorganizarComandas = () => {
    const openComandas = Array.from(document.querySelectorAll('.comanda'));
    const sortBy = 'total-desc';
    openComandas.sort((a, b) => {
        if (sortBy === 'total-desc') {
            const totalA = parseFloat(a.querySelector('.total')?.innerText.replace(/[^\d,.]/g, '').replace(',', '.') || 0);
            const totalB = parseFloat(b.querySelector('.total')?.innerText.replace(/[^\d,.]/g, '').replace(',', '.') || 0);
            return totalB - totalA;
        }
        return 0;
    });

    DOM.openComandas.innerHTML = '';
    openComandas.forEach((comanda, index) => {
        const rowIndex = Math.floor(index / 4);
        const row = getOrCreateRow(rowIndex, DOM.openComandas);
        row.appendChild(comanda);

        const id = comanda.id.split('-')[1];
        const expandBtn = comanda.querySelector(`#expandBtn-${id}`);
        const shareBtn = comanda.querySelector(`#shareBtn-${id}`);
        if (expandBtn) {
            expandBtn.replaceWith(expandBtn.cloneNode(true));
            const newExpandBtn = comanda.querySelector(`#expandBtn-${id}`);
            newExpandBtn.addEventListener('click', () => toggleExpand(id));
            newExpandBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(id);
                }
            });
        }
        if (shareBtn) {
            shareBtn.replaceWith(shareBtn.cloneNode(true));
            const newShareBtn = comanda.querySelector(`#shareBtn-${id}`);
            newShareBtn.addEventListener('click', () => shareComanda(id));
            newShareBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    shareComanda(id);
                }
            });
        }
    });

    DOM.emptyMessage.style.display = openComandas.length === 0 ? 'block' : 'none';
    salvarComandasDebounced();
};

const carregarComandas = () => {
    let saved = {};
    try {
        const stored = localStorage.getItem('comandas');
        if (stored) {
            saved = JSON.parse(stored);
            console.log('Comandas carregadas:', saved);
        }
    } catch (error) {
        console.error('Erro ao carregar comandas:', error);
        showToast('Erro ao carregar comandas. Iniciando com lista vazia.');
        localStorage.setItem('comandas', JSON.stringify({}));
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const comanda = entry.target;
                comanda.style.opacity = 1;
                observer.unobserve(comanda);
            }
        });
    }, { threshold: 0.1 });

    if (saved && typeof saved === 'object') {
        Object.entries(saved).forEach(([id, data]) => {
            try {
                const quantidades = Array.isArray(data.quantidades) ? data.quantidades : new Array(produtos.length).fill(0);
                const comanda = createComanda(id, data.nome || '', quantidades, data.desconto || 0, data.taxa || 0);
                comanda.style.opacity = 0;
                const todasComandas = DOM.openComandas.querySelectorAll('.comanda').length;
                const rowIndex = Math.floor(todasComandas / 4);
                const row = getOrCreateRow(rowIndex, DOM.openComandas);
                row.appendChild(comanda);
                if (data.expanded) toggleExpand(id);
                observer.observe(comanda);
            } catch (error) {
                console.error(`Erro ao criar comanda ${id}:`, error);
            }
        });
    }

    DOM.emptyMessage.style.display = Object.keys(saved).length === 0 ? 'block' : 'none';
    updateTotalDebt();
};

const addNewComanda = () => {
    DOM.popup.classList.add('popup-add-comanda');
    DOM.popupTitle.innerHTML = `
        <span><i class="fas fa-plus-circle"></i> Adicionar Nova Comanda</span>
        <div class="name-container">
            <input type="text" class="customer-name" placeholder="Nome do cliente">
        </div>
    `;
    DOM.popupTableBody.innerHTML = '';
    DOM.popupContent.innerHTML = `
        <table>
            <tr><th scope="col">Produto</th><th scope="col">Qtd</th></tr>
            ${produtos.map(p => `
                <tr>
                    <td>${p.nome}</td>
                    <td><input type="number" class="quantidade" min="0" value="0"></td>
                </tr>
            `).join('')}
        </table>
        <div class="buttons">
            <button class="submit-btn" disabled>Confirmar</button>
            <button class="cancel-btn">Cancelar</button>
        </div>
    `;
    DOM.popupOverlay.classList.add('active');
    DOM.popupTotal.style.display = 'none';

    const nameInput = DOM.popup.querySelector('.customer-name');
    const quantidades = DOM.popupContent.querySelectorAll('.quantidade');
    const submitBtn = DOM.popupContent.querySelector('.submit-btn');
    const cancelBtn = DOM.popupContent.querySelector('.cancel-btn');

    nameInput.addEventListener('input', atualizarTotalPopup);
    quantidades.forEach(input => input.addEventListener('input', atualizarTotalPopup));
    cancelBtn.addEventListener('click', closePopup);

    submitBtn.addEventListener('click', () => {
        if (submitBtn.disabled) return;

        const id = Date.now().toString();
        const quantidadesValues = Array.from(quantidades).map(input => input.value);
        const comanda = createComanda(id, nameInput.value, quantidadesValues, 0, 0);
        const todasComandas = DOM.openComandas.querySelectorAll('.comanda').length;
        const rowIndex = Math.floor(todasComandas / 4);
        const row = getOrCreateRow(rowIndex, DOM.openComandas);
        comanda.style.opacity = 0;
        row.appendChild(comanda);
        comanda.style.opacity = 1;

        reorganizarComandas();
        salvarComandasDebounced();
        updateTotalDebt();
        closePopup();
        showToast('Comanda adicionada!');
    });
};

// Tela de Bloqueio
const toggleLockScreen = () => {
    DOM.lockScreen.classList.add('active');
    DOM.lockPassword.focus();
    localStorage.setItem('isUnlocked', 'false');
    showToast('Tela bloqueada.');
};

// Adicionar Botão de Bloqueio Dinamicamente
const addLockButton = () => {
    if (!DOM.lockBtn) {
        const lockBtn = document.createElement('button');
        lockBtn.id = 'lockBtn';
        lockBtn.className = 'share-btn';
        lockBtn.innerHTML = '<i class="fas fa-lock"></i>';
        lockBtn.title = 'Bloquear Tela';
        lockBtn.style.position = 'fixed';
        lockBtn.style.top = '20px';
        lockBtn.style.right = '20px';
        lockBtn.style.zIndex = '1000';
        DOM.container.appendChild(lockBtn);
        DOM.lockBtn = lockBtn;
        DOM.lockBtn.addEventListener('click', toggleLockScreen);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // Sempre bloquear ao carregar a página
    DOM.lockScreen.classList.add('active');
    DOM.lockPassword.focus();
    localStorage.setItem('isUnlocked', 'false');

    DOM.lockForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const valor = DOM.lockPassword.value.trim();
        const senhaCorreta = "123456";

        if (valor === senhaCorreta) {
            DOM.lockScreen.classList.remove('active');
            localStorage.setItem('isUnlocked', 'true');
            showToast("Acesso liberado!");
            addLockButton(); // Adicionar botão de bloqueio após desbloquear
        } else {
            DOM.lockPassword.classList.add('shake');
            DOM.lockPassword.addEventListener('animationend', () => {
                DOM.lockPassword.classList.remove('shake');
            }, { once: true });
            showToast("Senha incorreta.");
            DOM.lockPassword.value = '';
            DOM.lockPassword.focus();
        }
    });

    DOM.popup.querySelector('.close-btn').addEventListener('click', closePopup);

    updateClock();
    setInterval(updateClock, 1000);
    setTimeout(carregarComandas, 100);
});

// Inicialização
DOM.addComanda.addEventListener('click', addNewComanda);