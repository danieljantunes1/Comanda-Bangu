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
    sidebar: document.getElementById('sidebar'),
    clock: document.getElementById('clock'),
    totalDebt: document.getElementById('totalDebt'),
    addComanda: document.getElementById('addComanda'),
    addProduto: document.getElementById('addProduto'),
    deleteProduto: document.getElementById('deleteProduto'),
    exportCSV: document.getElementById('exportCSV'),
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
    toggleTheme: document.getElementById('toggleTheme'),
    historyBody: document.getElementById('historyBody')
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

const atualizarTotal = debounce((comandaId) => {
    const comanda = document.getElementById(`comanda-${comandaId}`);
    if (!comanda) return;
    const quantidades = comanda.querySelectorAll('.quantidade');
    const totais = comanda.querySelectorAll('.preco-total');
    let total = 0;

    quantidades.forEach((input, i) => {
        let qty = Math.max(0, parseInt(input.value) || 0);
        if (qty < 0) showToast('Quantidade negativa ajustada para 0');
        input.value = qty;
        const subtotal = qty * produtos[i].preco;
        totais[i].innerText = formatCurrency(subtotal);
        total += subtotal;
    });

    const totalElement = document.getElementById(`total-${comandaId}`);
    if (totalElement) {
        totalElement.innerText = `Total: ${formatCurrency(total)}`;
    }

    // Atualizar o popup de detalhes, se aberto
    if (DOM.popupOverlay.classList.contains('active') && DOM.popupTableBody.innerHTML) {
        DOM.popupTotal.innerText = `Total: ${formatCurrency(total)}`;
        DOM.popupTotal.style.display = 'block';
    }

    // Garantir que o botão de detalhes aparece se houver itens
    const popupBtn = document.getElementById(`popupBtn-${comandaId}`);
    if (popupBtn) {
        popupBtn.classList.toggle('hidden', total === 0);
    }

    salvarComandas();
    updateTotalDebt();

    // Atualizar visibilidade dos itens com base no estado de expansão
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
};

const togglePopup = (comandaId) => {
    const comanda = document.getElementById(`comanda-${comandaId}`);
    if (!comanda) return;
    const customerName = comanda.querySelector(`#customerName-${comandaId}`)?.value || 'Cliente';
    const quantidades = Array.from(comanda.querySelectorAll('.quantidade')).map(input => input.value);

    if (!DOM.popupOverlay.classList.contains('active')) {
        DOM.popup.classList.remove('popup-add-comanda');
        DOM.popupTitle.innerHTML = `<i class="fas fa-file-alt"></i> Detalhes da Comanda - ${customerName}`;
        DOM.popupTableBody.innerHTML = produtos.map((p, i) => {
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
        }).join('');
        DOM.popupContent.innerHTML = '';
        DOM.popupOverlay.classList.add('active');
        atualizarTotal(comandaId);

        // Garantir que o botão de compartilhamento seja exibido e funcional
        const shareBtn = DOM.popup.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.style.display = 'flex';
            shareBtn.onclick = () => shareComanda(comandaId); // Registrar o evento
        }
    } else {
        closePopup();
    }
};

const closePopup = () => {
    DOM.popupOverlay.classList.remove('active');
    DOM.popup.classList.remove('popup-add-comanda');
    DOM.popupContent.innerHTML = '';
    DOM.popupTotal.innerText = '';
    DOM.popupTotal.style.display = 'none';
    const shareBtn = DOM.popup.querySelector('.share-btn');
    if (shareBtn) shareBtn.style.display = 'none';
};

const shareComanda = async (comandaId) => {
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

        await new Promise((resolve, reject) => {
            logoImg.onload = () => {
                doc.setFillColor(255, 255, 255);
                doc.rect(10, 10, 30, 30, 'F');
                doc.addImage(logoImg, 'PNG', 10, 10, 30, 30);
                logoAdded = true;
                resolve();
            };
            logoImg.onerror = () => {
                console.error('Erro ao carregar o logo "bangu.png".');
                showToast('Erro ao carregar o logo. PDF gerado sem logo.');
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

    const closeBtn = DOM.popup.querySelector('.close-btn');
    const shareBtn = DOM.popup.querySelector('.share-btn');
    if (closeBtn) closeBtn.style.display = 'none';
    if (shareBtn) shareBtn.style.display = 'none';

    let popupHeight = 0;
    try {
        const popupContent = DOM.popup;
        const canvas = await html2canvas(popupContent, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        popupHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(imgData, 'PNG', 10, 55, imgWidth, popupHeight);
    } catch (error) {
        console.error('Erro ao capturar o pop-up:', error);
        showToast('Erro ao capturar o conteúdo do pop-up.');
    }

    if (closeBtn) closeBtn.style.display = 'block';
    if (shareBtn) shareBtn.style.display = 'flex';

    const pixMessageY = 55 + popupHeight + 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Pague via Pix para Boteco do Zé:', 10, pixMessageY);
    doc.setFontSize(12);
    doc.text('Chave Pix: (21) 98765-4321', 10, pixMessageY + 10);

    const pixKey = '(21) 98765-4321';
    const pixLink = `https://pix.bcb.gov.br/${encodeURIComponent(pixKey)}`;
    const qrCodeDiv = document.getElementById('qrcode');
    qrCodeDiv.innerHTML = '';
    new QRCode(qrCodeDiv, {
        text: pixLink,
        width: 100,
        height: 100,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    try {
        const qrCanvas = qrCodeDiv.querySelector('canvas');
        const qrImgData = qrCanvas.toDataURL('image/png');
        doc.addImage(qrImgData, 'PNG', 150, pixMessageY - 10, 40, 40);
    } catch (error) {
        console.error('Erro ao capturar o QR Code:', error);
        showToast('Erro ao gerar o QR Code para o Pix.');
    }

    try {
        const pdfBlob = doc.output('blob');
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comanda_${comandaId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('PDF da comanda gerado e baixado!');
    } catch (error) {
        console.error('Erro ao salvar o PDF:', error);
        showToast('Erro ao salvar o PDF.');
    }
};

const removeComanda = (id) => {
    const comanda = document.getElementById(`comanda-${id}`);
    if (!comanda) return;
    const isSocio = comanda.querySelector(`#socio-${id}`)?.checked;
    const quantidades = Array.from(comanda.querySelectorAll('.quantidade')).map(input => parseInt(input.value) || 0);
    const items = produtos.map((p, i) => ({
        nome: p.nome,
        preco: p.preco,
        quantidade: quantidades[i]
    })).filter(item => item.quantidade > 0);

    if (isSocio) {
        const closedComandas = JSON.parse(localStorage.getItem('closedComandas')) || [];
        closedComandas.push({
            id,
            nome: comanda.querySelector(`#customerName-${id}`)?.value || 'Cliente',
            total: comanda.querySelector(`.total`)?.innerText || 'R$ 0,00',
            items: items,
            closedAt: new Date().toLocaleString('pt-BR')
        });
        localStorage.setItem('closedComandas', JSON.stringify(closedComandas));
        loadHistory();
    }

    comanda.remove();
    reorganizarComandas();
    salvarComandas();
    updateTotalDebt();
    showToast('Comanda fechada!');
};

const createComanda = (id, nome = '', quantidades = []) => {
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
        <div class="footer">
            <div class="buttons">
                <button id="expandBtn-${id}" class="expand-btn" title="Expandir/Recolher Comanda" tabindex="0"><i class="fas fa-expand"></i></button>
                <button id="popupBtn-${id}" class="popup-btn${quantidades.reduce((sum, qty) => sum + (parseInt(qty) || 0), 0) === 0 ? ' hidden' : ''}" title="Ver Detalhes (Pop-up)" tabindex="0"><i class="fas fa-external-link-alt"></i></button>
            </div>
            <div class="socio-container">
                <div class="socio-checkbox">
                    <input type="checkbox" id="socio-${id}">
                    <label for="socio-${id}" style="margin-left: 2px;">Sócio</label>
                </div>
                <div class="total" id="total-${id}">Total: ${formatCurrency(quantidades.reduce((sum, qty, i) => sum + (parseInt(qty) || 0) * produtos[i].preco, 0))}</div>
            </div>
        </div>
    `;

    const expandBtn = comanda.querySelector(`#expandBtn-${id}`);
    const popupBtn = comanda.querySelector(`#popupBtn-${id}`);
    const socioCheckbox = comanda.querySelector(`#socio-${id}`);
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

    if (popupBtn) {
        popupBtn.addEventListener('click', () => togglePopup(id));
        popupBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePopup(id);
            }
        });
    }

    if (socioCheckbox) {
        socioCheckbox.addEventListener('change', () => updateSocioStatus(id));
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', () => removeComanda(id));
    }

    comanda.querySelectorAll('.quantidade').forEach(input => {
        input.addEventListener('input', () => atualizarTotal(id));
    });

    const customerNameInput = comanda.querySelector(`#customerName-${id}`);
    if (customerNameInput) {
        customerNameInput.addEventListener('input', salvarComandas);
    }

    return comanda;
};

const updateSocioStatus = (comandaId) => {
    const comanda = document.getElementById(`comanda-${comandaId}`);
    if (!comanda) return;
    const socioCheckbox = comanda.querySelector(`#socio-${comandaId}`);
    if (socioCheckbox) {
        comanda.classList.toggle('socio-active', socioCheckbox.checked);
    }
    salvarComandas();
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
        } else if (sortBy === 'name-asc') {
            const nameA = a.querySelector('input[type="text"]')?.value.toLowerCase() || '';
            const nameB = b.querySelector('input[type="text"]')?.value.toLowerCase() || '';
            return nameA.localeCompare(nameB);
        }
        return 0;
    });

    DOM.openComandas.innerHTML = '';
    openComandas.forEach((comanda, index) => {
        const rowIndex = Math.floor(index / 4);
        const row = getOrCreateRow(rowIndex, DOM.openComandas);
        row.appendChild(comanda);

        // Reatribuir eventos para garantir que não sejam perdidos
        const id = comanda.id.split('-')[1];
        const expandBtn = comanda.querySelector(`#expandBtn-${id}`);
        const popupBtn = comanda.querySelector(`#popupBtn-${id}`);
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
        if (popupBtn) {
            popupBtn.replaceWith(popupBtn.cloneNode(true));
            const newPopupBtn = comanda.querySelector(`#popupBtn-${id}`);
            newPopupBtn.addEventListener('click', () => togglePopup(id));
            newPopupBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    togglePopup(id);
                }
            });
        }
    });

    DOM.emptyMessage.style.display = openComandas.length === 0 ? 'block' : 'none';
};

const salvarComandas = () => {
    const comandas = {};
    document.querySelectorAll('.comanda').forEach(c => {
        const id = c.id.split('-')[1];
        const customerNameInput = document.getElementById(`customerName-${id}`);
        const socioCheckbox = document.getElementById(`socio-${id}`);
        comandas[id] = {
            nome: customerNameInput?.value || '',
            quantidades: Array.from(c.querySelectorAll('.quantidade')).map(i => i.value),
            isSocio: socioCheckbox?.checked || false,
            expanded: c.classList.contains('expanded'),
            createdAt: comandas[id]?.createdAt || new Date().toISOString()
        };
    });
    localStorage.setItem('comandas', JSON.stringify(comandas));
};

const carregarComandas = () => {
    const saved = JSON.parse(localStorage.getItem('comandas')) || {};
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const comanda = entry.target;
                comanda.style.opacity = 1;
                observer.unobserve(comanda);
            }
        });
    }, { threshold: 0.1 });

    Object.entries(saved).forEach(([id, data]) => {
        const comanda = createComanda(id, data.nome, data.quantidades);
        comanda.style.opacity = 0;
        const todasComandas = DOM.openComandas.querySelectorAll('.comanda').length;
        const rowIndex = Math.floor(todasComandas / 4);
        const row = getOrCreateRow(rowIndex, DOM.openComandas);
        row.appendChild(comanda);
        const socioCheckbox = document.getElementById(`socio-${id}`);
        if (socioCheckbox) {
            socioCheckbox.checked = data.isSocio || false;
            if (data.isSocio) comanda.classList.add('socio-active');
        }
        if (data.expanded) toggleExpand(id);
        observer.observe(comanda);
    });

    DOM.emptyMessage.style.display = Object.keys(saved).length === 0 ? 'block' : 'none';
    updateTotalDebt();
};

const loadHistory = () => {
    const closedComandas = JSON.parse(localStorage.getItem('closedComandas')) || [];
    DOM.historyBody.innerHTML = closedComandas.map(c => `
        <tr>
            <td>${c.nome}</td>
            <td>${c.total}</td>
            <td>${c.closedAt}</td>
            <td>${c.items.map(item => `${item.nome} (${item.quantidade})`).join(', ')}</td>
        </tr>
    `).join('');
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
            <button class="submit-btn" disabled><i class="fas fa-check"></i> Confirmar</button>
            <button class="cancel-btn"><i class="fas fa-times"></i> Cancelar</button>
        </div>
    `;
    DOM.popupOverlay.classList.add('active');

    const nameInput = DOM.popup.querySelector('.customer-name');
    const quantidades = DOM.popupContent.querySelectorAll('.quantidade');
    const submitBtn = DOM.popupContent.querySelector('.submit-btn');
    const cancelBtn = DOM.popupContent.querySelector('.cancel-btn');

    nameInput.addEventListener('input', atualizarTotalPopup);
    quantidades.forEach(input => input.addEventListener('input', atualizarTotalPopup));
    cancelBtn.addEventListener('click', closePopup);
    submitBtn.addEventListener('click', () => {
        const id = Date.now().toString();
        const quantidadesValues = Array.from(quantidades).map(input => input.value);
        const comanda = createComanda(id, nameInput.value, quantidadesValues);
        const todasComandas = DOM.openComandas.querySelectorAll('.comanda').length;
        const rowIndex = Math.floor(todasComandas / 4);
        const row = getOrCreateRow(rowIndex, DOM.openComandas);
        comanda.style.opacity = 0;
        row.appendChild(comanda);
        comanda.style.opacity = 1;
        reorganizarComandas();
        salvarComandas();
        updateTotalDebt();
        closePopup();
        showToast('Comanda adicionada!');
    });
};

// Inicialização
DOM.addComanda.addEventListener('click', addNewComanda);
DOM.popup.querySelector('.close-btn').addEventListener('click', closePopup);
updateClock();
setInterval(updateClock, 1000);
carregarComandas();
loadHistory();