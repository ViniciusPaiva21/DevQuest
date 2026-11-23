# DevQuest — piloto Decoreba com dica em 10 segundos

Atualização de 23/11/2026, baseada no ZIP Decoreba entregue anteriormente. Versão aprovada para atualização do GitHub.

## Matérias do teste

- Empreendedorismo e Negócios: 25 questões.
- Segurança da Informação: 65 questões.

As outras 16 matérias mantêm o Decoreba anterior. O quiz normal, o Infernus e todos os bancos de questões permanecem intactos.

## Ajustes visuais desta versão

- Destaque dentro da alternativa, sem etiqueta abaixo.
- Área de leitura ampliada e remoção de quebras artificiais vindas dos PDFs; afirmações numeradas continuam separadas.
- Painel de revelação com contagem de 10s até 00s, visível durante a rolagem.

## Funcionamento

1. Apenas os destaques da pergunta brilham no início.
2. As alternativas mantêm seu texto original, sem etiquetas ou palavras duplicadas abaixo.
3. Após 10 segundos, somente um trecho do próprio texto da alternativa correta também brilha. O brilho acompanha os quatro temas.
4. É possível marcar antes ou depois da dica. Ao marcar, aparece a correção e o botão de próxima questão é liberado.
5. Cada questão nova começa seu próprio cronômetro. Ao voltar, respostas já dadas e dicas já liberadas são preservadas; uma questão ainda sem dica reinicia os 10 segundos.
6. As questões e alternativas continuam embaralhadas; as chaves acompanham o conteúdo, nunca a letra.

Os trechos em destaque pertencem ao próprio texto das alternativas; os enunciados e gabaritos não foram reescritos. Não há chaves idênticas para textos diferentes dentro da mesma questão. Exceção: uma questão de Empreendedorismo já contém duas alternativas de texto idêntico sobre tipos de inovação; ambas mantêm a mesma chave. Questões com assertivas usam combinações de numerais ou resumos V/F para preservar seu significado.

## Abrir sem publicar

Extraia o ZIP e abra um terminal na pasta do projeto. Execute:

    python -m http.server 8000

Abra http://localhost:8000/decoreba.html e escolha uma das duas matérias identificadas como teste de 10 segundos. Também é possível usar Live Server no VS Code.

Não abra o HTML por duplo clique: o carregamento dos arquivos JSON exige HTTP. Fontes e ícones externos precisam de internet, como na versão anterior.

## Verificação

Execute `npm test` com Node.js instalado; os testes não exigem instalação de dependências.

Os testes passaram para os 573 gabaritos, o modo anterior, as 90 questões do piloto, as chaves por alternativa, a liberação após 10 segundos, resposta antecipada, navegação, reinício e recuperação de erro. Os arquivos originais de questões e as lógicas do quiz normal e Infernus foram comparados e preservados.

A conferência visual em navegador real não pôde ser concluída neste ambiente. Confira os temas em computador e celular antes de publicar.

## Arquivos do piloto

- `data/decoreba-pilot.json`: chaves finais associadas ao texto das alternativas das duas matérias.
- `data/decoreba-cues.json`: destaques já existentes nos enunciados.
- `js/decoreba-core.js` e `js/decoreba.js`: apresentação, respostas e cronômetro.
- `css/decoreba.css` e `decoreba.html`: interface.
- `scripts/test-decoreba.mjs`: testes de regressão e do piloto.

Ao editar o texto de uma questão ou alternativa, atualize também suas chaves e execute os testes.
