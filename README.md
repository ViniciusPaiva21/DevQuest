# DevQuest

Quiz estático para estudar conteúdos de ADS e Ciência da Computação. O projeto possui um modo normal por matéria e o **Modo Infernus**, que mistura as matérias selecionadas.

## Executar localmente

Os arquivos JSON são carregados com `fetch`, portanto abra o projeto por um servidor local:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Estrutura

- `index.html`: página inicial com as três novas disciplinas de ADS em destaque.
- `disciplinas.html`: catálogo completo, com as trilhas de ADS e CC separadas por uma divisória.
- `quiz.html`: página única usada por todas as matérias.
- `infernus.html`: modo que mistura várias matérias.
- `js/subjects.js`: configuração central das matérias e cursos.
- `js/theme.js`: seletor de temas e persistência da escolha no navegador.
- `js/quiz.js`: funcionamento do quiz normal.
- `js/infernus.js`: funcionamento do Modo Infernus.
- `css/themes.css`: aparência dos temas Noite e Clássico.
- `data/`: bancos de questões em JSON.

O acervo atual reúne 390 questões objetivas em 13 bancos de matérias. Na trilha ADS, Arquitetura de Sistemas, Fundamentos de Redes e Governança de TI foram consolidadas a partir dos materiais de revisão, sem questões discursivas nem capturas repetidas.

As páginas antigas, como `frontend.html`, continuam disponíveis e redirecionam para a nova página única.

## Temas

O botão no canto superior direito permite escolher entre **Noite** e **Clássico**. A preferência é armazenada em `localStorage` com a chave `devquest-theme`, portanto continua ativa nas próximas visitas feitas pelo mesmo navegador.

## Validar as questões

```bash
npm test
```

A validação confere o formato dos JSONs, alternativas duplicadas, respostas corretas, imagens ausentes e a presença indevida de questões discursivas.
Também confere se todos os cards possuem cores exclusivas e se a organização das duas trilhas permanece válida.
