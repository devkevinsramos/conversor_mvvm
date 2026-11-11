# Câmbio — Conversor de Moedas

Aplicativo mobile desenvolvido em **React Native e JavaScript**, com **Expo** e arquitetura **MVVM (Model–View–ViewModel)**. As taxas e a lista de moedas são consultadas na API pública Frankfurter.

## Funcionalidades

- Seleção de moedas por pesquisa e conversão de valores positivos, inclusive decimais.
- Exibição do valor convertido, da taxa aplicada e da data de referência da API.
- Validação dos campos e tratamento de erros de rede, HTTP e respostas inválidas.
- Indicadores de carregamento e bloqueio de conversões repetidas durante uma consulta.
- Botão para inverter as moedas e histórico das últimas seis conversões na sessão.
- Interface com três abas: **Conversor**, **Histórico** e **Sobre**.

As taxas da Frankfurter são **taxas de referência**, não cotações comerciais em tempo real. O aplicativo exige conexão com a internet para consultar os dados.

## Instalação e execução

**Requisitos:** Node.js 22 LTS, npm, Expo Go compatível com o **Expo SDK 54**, emulador Android/iOS ou celular.

```bash
npm install
npx expo start
```

Abra o aplicativo com o Expo Go lendo o QR Code ou use o emulador. Também é possível iniciar diretamente pelo terminal:

```bash
npm run android
```

Para executar os testes automatizados:

```bash
npm test
```

O Expo Go precisa ser compatível com o SDK 54 utilizado neste projeto. Em caso de mensagem de incompatibilidade, selecione uma versão adequada em https://expo.dev/go/ (principalmente no Android). Não é necessário configurar chave de API nem arquivo `.env`.

## Organização MVVM

```text
.
├── App.js
├── index.js
├── app.json
├── package.json
├── src/
│   ├── models/
│   │   └── currencyModel.js
│   ├── viewmodels/
│   │   └── useConverterViewModel.js
│   ├── views/
│   │   ├── ConverterScreen.js
│   │   ├── HistoryScreen.js
│   │   └── AboutScreen.js
│   ├── components/
│   │   ├── AppButton.js
│   │   └── CurrencyPicker.js
│   ├── navigation/
│   │   └── AppNavigator.js
│   ├── theme/
│   │   └── colors.js
│   └── utils/
│       └── conversion.js
├── tests/
│   ├── conversion.test.mjs
│   └── model.test.mjs
├── snack/
│   └── App.js
└── screenshots/
```

- **Model:** acesso aos endpoints HTTP, validação do formato das respostas e tratamento de falhas.
- **ViewModel:** gerenciamento de estados, validações, coordenação da conversão, cálculo e histórico.
- **View:** campos, seletores, ações, mensagens e exibição dos resultados.

O diretório `snack/` contém uma **versão independente, em arquivo único**, para demonstração rápida no https://snack.expo.dev/. Para avaliação da arquitetura MVVM, utilize **o projeto da raiz** com as camadas separadas em `src/`.

## API

- Moedas: `https://api.frankfurter.dev/v2/currencies`
- Taxa de câmbio: `https://api.frankfurter.dev/v2/rate/USD/BRL`
- Documentação: https://frankfurter.dev/

Os códigos de origem e destino da requisição mudam conforme as moedas escolhidas. O resultado é calculado multiplicando o valor pela taxa que a API devolve.

## Testes e entrega

Execute `npm test` para verificar as validações, os cálculos, os formatos de resposta e os erros da API usando respostas simuladas. Antes da entrega, confira no celular ou emulador: carregamento inicial das moedas, conversão válida, valor vazio, zero, negativo, entradas decimais, moedas iguais, consulta sem internet, indicador de carregamento, nova conversão e exibição da taxa/data.

Para os **prints exigidos na atividade**, faça capturas reais do aplicativo aberto, de preferência mostrando uma conversão concluída e a tela de seleção de moedas. Salve os arquivos na pasta `screenshots/` e inclua-os no repositório GitHub.

## Publicar no GitHub

Crie um repositório vazio no GitHub, abra um terminal **nesta pasta** e execute:

```bash
git init
git add .
git commit -m "Entrega do conversor de moedas em React Native com MVVM"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

Substitua o endereço de exemplo pelo endereço real do repositório. Se o repositório já existir, use-o normalmente sem recriar sua configuração Git.
