
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
            searchBar: document.getElementById('searchBar'),
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
            DOM.totalDebt.innerText = `Total na rua: ${formatCurrency(totalDebt)}`;
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
            const items = comanda.querySelectorAll('.item');
            let total = 0;

            quantidades.forEach((input, i) => {
                let qty = Math.max(0, parseInt(input.value) || 0);
                if (qty < 0) showToast('Quantidade negativa ajustada para 0');
                input.value = qty;
                const subtotal = qty * produtos[i].preco;
                totais[i].innerText = formatCurrency(subtotal);
                total += subtotal;
            });

            const isExpanded = comanda.classList.contains('expanded');
            items.forEach((item, i) => {
                item.classList.toggle('hidden', !isExpanded && i >= 4);
            });

            document.getElementById(`total-${comandaId}`).innerText = `Total: ${formatCurrency(total)}`;
            if (DOM.popupOverlay.classList.contains('active')) {
                DOM.popupTotal.innerText = `Total: ${formatCurrency(total)}`;
            }
            const popupBtn = document.getElementById(`popupBtn-${comandaId}`);
            popupBtn.classList.toggle('hidden', total === 0);
            salvarComandas();
            updateTotalDebt();
        }, 300);

        const toggleExpand = (comandaId) => {
            const comanda = document.getElementById(`comanda-${comandaId}`);
            if (!comanda) return;
            const expandBtn = document.getElementById(`expandBtn-${comandaId}`);
            comanda.classList.toggle('expanded');
            expandBtn.querySelector('i').className = comanda.classList.contains('expanded') ? 'fas fa-compress' : 'fas fa-expand';
            const items = comanda.querySelectorAll('.item');
            items.forEach((item, i) => {
                if (comanda.classList.contains('expanded')) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.toggle('hidden', i >= 4);
                }
            });
            atualizarTotal(comandaId);
        };

        const togglePopup = (comandaId) => {
            const comanda = document.getElementById(`comanda-${comandaId}`);
            if (!comanda) return;
            const customerName = comanda.querySelector(`#customerName-${comandaId}`).value || 'Cliente';
            const quantidades = Array.from(comanda.querySelectorAll('.quantidade')).map(input => input.value);

            if (!DOM.popupOverlay.classList.contains('active')) {
                DOM.popupTitle.innerText = `Detalhes da Comanda - ${customerName}`;
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
                DOM.popupOverlay.classList.add('active');
                atualizarTotal(comandaId);

                const shareBtn = DOM.popup.querySelector('.share-btn');
                shareBtn.onclick = () => shareComanda(comandaId);
            } else {
                closePopup();
            }
        };

        const closePopup = () => {
            DOM.popupOverlay.classList.remove('active');
        };

        const shareComanda = async (comandaId) => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, 210, 297, 'F');

            let logoAdded = false;
            try {
                const logoUrl = 'imagens/bangu-tavares.png';
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
                        console.error('Erro ao carregar o logo "bangu-tavares.png".');
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
            const isSocio = comanda.querySelector(`#socio-${id}`).checked;
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
                    nome: comanda.querySelector(`#customerName-${id}`).value,
                    total: comanda.querySelector(`.total`).innerText,
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

        const createComanda = (id) => {
            const comanda = document.createElement('div');
            comanda.className = 'comanda';
            comanda.id = `comanda-${id}`;
            comanda.innerHTML = `
                <div class="comanda-header">
                    <div class="comanda-header-left">
                        <label for="customerName-${id}">Nome:</label>
                        <input type="text" id="customerName-${id}" placeholder="Digite o nome do cliente">
                    </div>
                    <button class="remove-btn" onclick="removeComanda(${id})" aria-label="Remover Comanda">X</button>
                </div>
                <table>
                    <tr><th scope="col">Produto</th><th scope="col">Qtd</th><th scope="col">Total</th></tr>
                    ${produtos.map((p, i) => `
                        <tr class="item${i >= 4 ? ' hidden' : ''}">
                            <td title="Preço: ${formatCurrency(p.preco)}">${p.nome}</td>
                            <td><input type="number" class="quantidade" min="0" value="0"></td>
                            <td class="preco-total">R$ 0,00</td>
                        </tr>
                    `).join('')}
                </table>
                <div class="footer">
                    <div class="buttons">
                        <button id="expandBtn-${id}" class="expand-btn" title="Expandir Comanda" tabindex="0"><i class="fas fa-expand"></i></button>
                        <button id="popupBtn-${id}" class="popup-btn hidden" title="Ver Detalhes (Pop-up)" tabindex="0"><i class="fas fa-external-link-alt"></i></button>
                    </div>
                    <div class="socio-container">
                        <div class="socio-checkbox">
                            <input type="checkbox" id="socio-${id}">
                            <label for="socio-${id}" style="margin-left: 2px;">Sócio</label>
                        </div>
                        <div class="total" id="total-${id}">Total: R$ 0,00</div>
                    </div>
                </div>
            `;

            const expandBtn = comanda.querySelector(`#expandBtn-${id}`);
            const popupBtn = comanda.querySelector(`#popupBtn-${id}`);
            const socioCheckbox = comanda.querySelector(`#socio-${id}`);
            expandBtn.addEventListener('click', () => toggleExpand(id));
            popupBtn.addEventListener('click', () => togglePopup(id));
            socioCheckbox.addEventListener('change', () => updateSocioStatus(id));
            expandBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(id);
                }
            });
            popupBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    togglePopup(id);
                }
            });

            comanda.querySelectorAll('.quantidade').forEach(input => input.addEventListener('input', () => atualizarTotal(id)));
            comanda.querySelector(`#customerName-${id}`).addEventListener('input', salvarComandas);
            return comanda;
        };

        const updateSocioStatus = (comandaId) => {
            const comanda = document.getElementById(`comanda-${comandaId}`);
            const isSocio = comanda.querySelector(`#socio-${comandaId}`).checked;
            comanda.classList.toggle('socio-active', isSocio);
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
                    const totalA = parseFloat(a.querySelector('.total').innerText.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
                    const totalB = parseFloat(b.querySelector('.total').innerText.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
                    return totalB - totalA;
                } else if (sortBy === 'name-asc') {
                    const nameA = a.querySelector('input[type="text"]').value.toLowerCase();
                    const nameB = b.querySelector('input[type="text"]').value.toLowerCase();
                    return nameA.localeCompare(nameB);
                }
                return 0;
            });
            DOM.openComandas.innerHTML = '';
            openComandas.forEach((comanda, index) => {
                const rowIndex = Math.floor(index / 4);
                const row = getOrCreateRow(rowIndex, DOM.openComandas);
                row.appendChild(comanda);
            });
        };

        const salvarComandas = () => {
            const comandas = {};
            document.querySelectorAll('.comanda').forEach(c => {
                const id = c.id.split('-')[1];
                comandas[id] = {
                    nome: document.getElementById(`customerName-${id}`).value,
                    quantidades: Array.from(c.querySelectorAll('.quantidade')).map(i => i.value),
                    isSocio: document.getElementById(`socio-${id}`).checked,
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
                const comanda = createComanda(id);
                comanda.style.opacity = 0;
                const todasComandas = DOM.openComandas.querySelectorAll('.comanda').length;
                const rowIndex = Math.floor(todasComandas / 4);
                const row = getOrCreateRow(rowIndex, DOM.openComandas);
                row.appendChild(comanda);
                document.getElementById(`customerName-${id}`).value = data.nome;
                document.getElementById(`socio-${id}`).checked = data.isSocio || false;
                if (data.isSocio) comanda.classList.add('socio-active');
                const inputs = comanda.querySelectorAll('.quantidade');
                data.quantidades.forEach((qty, i) => i < inputs.length && (inputs[i].value = qty));
                if (data.expanded) toggleExpand(id);
                observer.observe(comanda);
                atualizarTotal(id);
            });
            reorganizarComandas();
        };

        const loadHistory = () => {
            const closedComandas = JSON.parse(localStorage.getItem('closedComandas')) || [];
            DOM.historyBody.innerHTML = closedComandas.map(c => `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.nome || 'Sem Nome'}</td>
                    <td>${c.total}</td>
                    <td>${c.closedAt}</td>
                </tr>
            `).join('');
        };

        const toggleSidebarAndMessage = () => {
            const comandasCount = document.querySelectorAll('.comanda').length;
            DOM.emptyMessage.style.display = comandasCount ? 'none' : 'block';
        };

        const filterComandas = () => {
            const searchValue = DOM.searchBar.value.toLowerCase();
            document.querySelectorAll('.comanda').forEach(c => {
                const nome = c.querySelector('input[type="text"]').value.toLowerCase();
                c.style.display = nome.includes(searchValue) ? 'block' : 'none';
            });
            reorganizarComandas();
        };

        const addProduto = () => {
            const nome = prompt('Nome do produto:');
            const preco = parseFloat(prompt('Preço do produto (em R$):'));
            const icon = prompt('Ícone (ex.: fa-beer-mug-empty, fa-glass-water, fa-bacon):') || 'fa-box';
            if (nome && !isNaN(preco) && preco > 0) {
                produtos.push({ nome, preco, icon });
                localStorage.setItem('produtos', JSON.stringify(produtos));
                recarregarComandas();
                showToast(`Produto ${nome} adicionado!`);
            } else {
                showToast('Nome ou preço inválido!');
            }
        };

        const deleteProduto = () => {
            const nome = prompt('Digite o nome do produto a excluir:');
            const index = produtos.findIndex(p => p.nome.toLowerCase() === nome.toLowerCase());
            if (index === -1) {
                showToast('Produto não encontrado!');
                return;
            }
            const comandas = JSON.parse(localStorage.getItem('comandas')) || {};
            const isInUse = Object.values(comandas).some(c => parseInt(c.quantidades[index]) > 0);
            if (isInUse) {
                showToast('Não pode excluir: produto em uso em comanda!');
                return;
            }
            produtos.splice(index, 1);
            localStorage.setItem('produtos', JSON.stringify(produtos));
            Object.values(comandas).forEach(c => c.quantidades.splice(index, 1));
            localStorage.setItem('comandas', JSON.stringify(comandas));
            recarregarComandas();
            showToast(`Produto ${nome} excluído!`);
        };

        const recarregarComandas = () => {
            DOM.openComandas.innerHTML = '';
            carregarComandas();
        };

        const exportToCSV = () => {
            const comandas = JSON.parse(localStorage.getItem('comandas')) || {};
            const csv = ['ID,Nome,Data de Criação,Total,Itens'];
            Object.entries(comandas).forEach(([id, data]) => {
                const comanda = document.getElementById(`comanda-${id}`);
                if (!comanda) return;
                const total = Array.from(comanda.querySelectorAll('.preco-total'))
                    .reduce((sum, el) => sum + (parseFloat(el.innerText.replace(/[^\d,.]/g, '').replace(',', '.')) || 0), 0);
                const quantidades = data.quantidades;
                const items = produtos.map((p, i) => ({
                    nome: p.nome,
                    preco: p.preco,
                    quantidade: quantidades[i]
                })).filter(item => parseInt(item.quantidade) > 0);
                const itemsStr = items.map(item => `${item.nome} (${formatCurrency(item.preco)}) x ${item.quantidade}`).join('; ');
                const createdAt = new Date(data.createdAt).toLocaleString('pt-BR');
                csv.push(`${id},${data.nome || 'Sem Nome'},${createdAt},${formatCurrency(total)},${itemsStr || 'Nenhum item'}`);
            });
            const csvData = new Blob([csv.join('\n')], { type: 'text/csv' });
            const url = window.URL.createObjectURL(csvData);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', 'comandas.csv');
            a.click();
        };

        const switchTab = (tabId) => {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            document.querySelector(`.nav-btn[data-tab="${tabId}"]`).classList.add('active');
            if (tabId === 'comandas') {
                DOM.searchBar.style.display = 'block';
                DOM.totalDebt.style.display = 'block';
                DOM.addComanda.style.display = 'block';
                DOM.addProduto.style.display = 'block';
                DOM.deleteProduto.style.display = 'block';
                DOM.exportCSV.style.display = 'block';
            } else {
                DOM.searchBar.style.display = 'none';
                DOM.totalDebt.style.display = 'none';
                DOM.addComanda.style.display = 'none';
                DOM.addProduto.style.display = 'none';
                DOM.deleteProduto.style.display = 'none';
                DOM.exportCSV.style.display = 'none';
            }
        };

        window.onload = () => {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-mode');
            }
            carregarComandas();
            loadHistory();
            toggleSidebarAndMessage();
            updateTotalDebt();
            setInterval(updateClock, 1000);
            updateClock();
            if (!navigator.onLine) showToast('Sistema offline');

            DOM.addComanda.addEventListener('click', () => {
                console.log('Botão Adicionar Comanda clicado'); // Log para depuração
                const newId = Date.now();
                const todasComandas = DOM.openComandas.querySelectorAll('.comanda').length;
                const rowIndex = Math.floor(todasComandas / 4);
                const row = getOrCreateRow(rowIndex, DOM.openComandas);
                row.appendChild(createComanda(newId));
                atualizarTotal(newId);
                reorganizarComandas();
                toggleSidebarAndMessage();
                showToast('Comanda adicionada!');
            });

            DOM.addProduto.addEventListener('click', addProduto);
            DOM.deleteProduto.addEventListener('click', deleteProduto);
            DOM.searchBar.addEventListener('input', debounce(filterComandas, 300));
            DOM.exportCSV.addEventListener('click', exportToCSV);
            DOM.toggleTheme.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
            });

            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.addEventListener('click', () => switchTab(btn.dataset.tab));
            });
        };
