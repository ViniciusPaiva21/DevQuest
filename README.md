# DevQuest

Quiz estático para estudar conteúdos de ADS e Ciência da Computação. O projeto possui um modo normal por matéria e o **Modo Infernus**, que mistura as matérias selecionadas.

## Executar localmente

Os arquivos JSON são carregados com `fetch`, portanto abra o projeto por um servidor local:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Estrutura

- `index.html`: página inicial com cinco novas disciplinas de ADS e CC em destaque.
- `disciplinas.html`: catálogo completo, com as trilhas de ADS e CC separadas por uma divisória.
- `quiz.html`: página única usada por todas as matérias.
- `infernus.html`: modo que mistura várias matérias.
- `js/subjects.js`: configuração central das matérias e cursos.
- `js/theme.js`: seletor de temas e persistência da escolha no navegador.
- `js/quiz.js`: funcionamento do quiz normal.
- `js/infernus.js`: funcionamento do Modo Infernus.
- `css/themes.css`: aparência dos temas Noite e Clássico.
- `data/`: bancos de questões em JSON.

O acervo atual reúne 581 questões objetivas em 18 bancos de matérias. Na trilha ADS, Arquitetura de Sistemas, Fundamentos de Redes e Governança de TI foram consolidadas a partir dos materiais de revisão, sem questões discursivas nem capturas repetidas.

As páginas antigas, como `frontend.html`, continuam disponíveis e redirecionam para a nova página única.

## Temas

O botão no canto superior direito permite escolher entre **Noite** e **Clássico**. A preferência é armazenada em `localStorage` com a chave `devquest-theme`, portanto continua ativa nas próximas visitas feitas pelo mesmo navegador.

## Validar as questões

```bash
npm test
```

A validação confere o formato dos JSONs, alternativas duplicadas, respostas corretas, imagens ausentes e a presença indevida de questões discursivas.
Também confere se todos os cards possuem cores exclusivas e se a organização das duas trilhas permanece válida.

## Materiais de outubro de 2026

Cinco novas disciplinas aparecem na página inicial, no topo do catálogo e no Modo Infernus:

| Disciplina | Questões objetivas | Páginas discursivas |
|---|---:|---:|
| Estrutura de Dados II (CC) | 30 | 0 |
| Álgebra Linear e Geometria Analítica (CC) | 29 | 0 |
| Empreendedorismo e Negócios (ADS) | 31 | 6 |
| Sistemas de Apoio à Tomada de Decisão (ADS) | 28 | 2 |
| Segurança da Informação (ADS) | 67 | 3 |

Os enunciados e as alternativas das 185 questões estão em texto selecionável. Apenas figuras e gráficos usam imagens recortadas. As alternativas mantêm a ordem do documento, inclusive as quatro alternativas da página 32 de Segurança. Os materiais discursivos também apresentam texto e figuras separadamente.

O material discursivo, incluindo as respostas presentes nos documentos, está disponível para revisão na própria página da disciplina e não altera a pontuação. As páginas de origem ficam registradas em `fonte.pagina` nos novos bancos. Questões apenas semelhantes são preservadas para evitar excluir variações.
