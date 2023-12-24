let inventoryData; // Armazenar os dados da planilha Excel
let selectedItems = []; // Armazenar os itens selecionados pelo usuário
let customerName = ''; // Armazenar o nome do requerente
let customerDOB = ''; // Armazenar a data de nascimento do requerente

// Função para ler a planilha Excel
async function readExcel() {
    const response = await fetch('valores_exames_samvida.xlsx');
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    inventoryData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    populateProductList();
}

// Carregar a planilha Excel ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    readExcel();
});

// Função para preencher a lista de produtos no dropdown
function populateProductList() {
    const productList = document.getElementById('productList');
    for (let i = 1; i < inventoryData.length; i++) {
        // Adicione esta verificação para evitar linhas em branco
        if (inventoryData[i].some(cell => cell.trim() !== '')) {
            const option = document.createElement('option');
            option.value = i;
            option.text = inventoryData[i][1]; // Assumindo que o nome do produto está na segunda coluna (índice 1)
            productList.add(option);
        }
    }
    // Preencher a tabela ao carregar os dados
    displayTable();
}

// Função para filtrar os produtos pelo nome
function filterProducts() {
    const productNameInput = document.getElementById('productName');
    const productList = document.getElementById('productList');

    const searchTerm = productNameInput.value.toLowerCase();

    // Limpa a lista de produtos
    productList.innerHTML = '<option value="" disabled selected>Exame Solicitado*</option>';

    // Preenche a lista com os produtos que correspondem ao termo de busca
    for (let i = 1; i < inventoryData.length; i++) {
        const productName = inventoryData[i][1].toLowerCase();
        if (productName.includes(searchTerm)) {
            const option = document.createElement('option');
            option.value = i;
            option.text = inventoryData[i][1];
            productList.add(option);
        }
    }
}

// Função para adicionar um produto à lista de orçamento
function addProduct() {
    const productList = document.getElementById('productList');
    const selectedProducts = document.getElementById('selectedProducts');
    const selectedIndex = productList.value;

    if (selectedIndex) {
        const selectedProductIndex = parseInt(selectedIndex, 10);
        const selectedProductData = inventoryData[selectedProductIndex];

        // Adiciona o item à lista de itens selecionados
        selectedItems.push({
            item: selectedProductData[0],
            produto: selectedProductData[1],
            preco: parseFloat(selectedProductData[2]) || 0,
            descricao: selectedProductData[3],
            observacoes: selectedProductData[4],
        });

        // Atualiza a tabela
        displayTable();

        // Reseta o valor do select para a opção padrão
        productList.value = '';
    }
}

document.addEventListener('keydown', function (event) {
    // Verifica se a combinação de teclas é CTRL+P (ou Command+P no Mac)
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        clearProductNameInput();
    }
});

// Função para limpar o campo de input texto
function clearProductNameInput() {
    const productNameInput = document.getElementById('productName');
    productNameInput.value = ''; // Define o valor do campo como vazio
    filterProducts(); // Chama a função de filtragem para atualizar a lista de produtos
}



// Função para remover um produto da lista de orçamento
function removeProduct(index) {
    selectedItems.splice(index, 1);
    displayTable();
}

// Função para imprimir o documento
function printDocument() {
    const pdf = new jsPDF();
    pdf.autoTable({
        html: '#tableContainer',
        theme: 'grid',
        columns: [
            { header: 'Executante', dataKey: 'Executante' },
            { header: 'Exame', dataKey: 'Exame' },
            { header: 'Valor (R$)', dataKey: 'Valor (R$)' },
            /*
            { header: 'Descrição', dataKey: 'descricao' },
            { header: 'Observações', dataKey: 'observacoes' },
            { header: 'Ação', dataKey: 'acao' },
            */
            { header: 'Nome do Requerente', dataKey: 'customerName' },
            { header: 'Data de Nascimento do Requerente', dataKey: 'customerDOB' }

        ],
        columnStyles: { 0: { fontStyle: 'bold' } },
        bodyStyles: { valign: 'top' },
        margin: { top: 20 },
        didParseCell: function (data) {
            // Ajusta a altura das células para acomodar o conteúdo
            const colKey = data.column.dataKey;
            if (colKey === 'descricao' || colKey === 'observacoes' || colKey === 'customerName' || colKey === 'customerDOB') {
                const cellHeight = data.cell.height / pdf.internal.scaleFactor;
                const textLines = pdf.splitTextToSize(data.cell.text, data.cell.textWidth);
                const lineHeight = pdf.internal.getLineHeight();
                const cellLines = Math.ceil(textLines.length / (data.cell.textPos.ratio || 1));
                const cellHeightScaleFactor = cellLines > 1 ? 1.5 : 1;
                const newCellHeight = cellHeightScaleFactor * cellLines * lineHeight;
                if (cellHeight < newCellHeight) {
                    data.cell.height = newCellHeight * pdf.internal.scaleFactor;
                }
            }
        },
    });

    // Imprime o documento
    pdf.autoPrint();
}

// Função para formatar um número como moeda (R$)
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Função para exibir a tabela completa
function displayTable() {
    const tableContainer = document.getElementById('tableContainer');
    tableContainer.innerHTML = ''; // Limpa o conteúdo anterior

    const table = document.createElement('table');
    table.setAttribute('border', '1');
    const tbody = document.createElement('tbody');

    // Linhas da tabela
    for (let row = 0; row < selectedItems.length; row++) {
        const tr = document.createElement('tr');
        for (let col = 0; col < Object.keys(selectedItems[row]).length; col++) {
            const td = document.createElement('td');
            const key = Object.keys(selectedItems[row])[col];

            // Verifica se a coluna é a de "Preço" e aplica a formatação de moeda
            if (key === 'preco') {
                td.textContent = formatCurrency(selectedItems[row][key]);
            } else {
                td.textContent = selectedItems[row][key];
            }

            tr.appendChild(td);
        }

        const removeTd = document.createElement('td');
        const removeButton = document.createElement('button');
        removeButton.textContent = 'X';
        removeButton.onclick = function () {
            removeProduct(row);
        };
        removeTd.appendChild(removeButton);
        tr.appendChild(removeTd);
        tbody.appendChild(tr);
    }

    // Adiciona a soma dos valores da coluna "Preço"
    const totalRow = document.createElement('tr');
    const totalLabel = document.createElement('td');
    totalLabel.textContent = 'TOTAL COM DESCONTOS SAMVIDA';
    totalLabel.style.fontWeight = 'bold'; // Adiciona negrito ao texto
    totalLabel.setAttribute('colspan', Object.keys(selectedItems[0]).length - 1); // Desconsidera a coluna "Ação"
    const totalPrice = selectedItems.reduce((acc, val) => acc + val.preco || 0, 0); // Soma dos valores da coluna "Preço"
    const totalValue = document.createElement('td');
    totalValue.textContent = formatCurrency(totalPrice); // Aplica formatação de moeda
    totalValue.style.fontWeight = 'bold'; // Adiciona negrito ao valor
    totalRow.appendChild(totalLabel);
    totalRow.appendChild(totalValue);
    tbody.appendChild(totalRow);

    // Função para limpar todos os dados
    function clearAll() {
        inventoryData = [];
        selectedItems = [];
        customerName = '';
        customerDOB = '';

        // Limpa os elementos HTML que exibem os dados
        document.getElementById('productList').innerHTML = '<option value="" disabled selected>Exame Solicitado*</option>';
        document.getElementById('tableContainer').innerHTML = '';

        // Preenche a tabela após limpar os dados
        displayTable();
    }

    table.appendChild(tbody);
    tableContainer.appendChild(table);
}