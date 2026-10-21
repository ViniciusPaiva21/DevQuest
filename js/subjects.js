(function () {
  "use strict";

  const subjects = {
    estruturasdados2: {
      "label": "Estrutura de Dados II",
      "description": "Árvores, heaps, ordenação e estruturas avançadas.",
      "jsonPath": "data/estruturasdados2.json",
      "jsonKey": "estruturasdados2",
      "icon": "layers-3",
      "accent": "emerald",
      "accentClass": "accent-emerald",
      "isNew": true
},
    algebralinear: {
      "label": "Álgebra Linear e Geometria Analítica",
      "description": "Vetores, matrizes, sistemas lineares, retas e planos.",
      "jsonPath": "data/algebralinear.json",
      "jsonKey": "algebralinear",
      "icon": "sigma",
      "accent": "blue",
      "accentClass": "accent-blue",
      "isNew": true
},
    empreendedorismo: {
      "label": "Empreendedorismo e Negócios",
      "description": "Empreendedorismo, inovação, planejamento e oportunidades.",
      "jsonPath": "data/empreendedorismo.json",
      "jsonKey": "empreendedorismo",
      "icon": "rocket",
      "accent": "orange",
      "accentClass": "accent-orange",
      "isNew": true
},
    apoiodecisao: {
      "label": "Sistemas de Apoio à Tomada de Decisão",
      "description": "Processo decisório, análise de dados e sistemas de apoio.",
      "jsonPath": "data/apoiodecisao.json",
      "jsonKey": "apoiodecisao",
      "icon": "chart-no-axes-combined",
      "accent": "green",
      "accentClass": "accent-green",
      "isNew": true
},
    segurancainformacao: {
      "label": "Segurança da Informação",
      "description": "Proteção de dados, redes, ameaças e controles de segurança.",
      "jsonPath": "data/segurancainformacao.json",
      "jsonKey": "segurancainformacao",
      "icon": "shield-check",
      "accent": "violet",
      "accentClass": "accent-violet",
      "isNew": true
},
    frontend: {
      label: "Frontend",
      description: "HTML, CSS, JavaScript e construção de interfaces.",
      jsonPath: "data/frontend.json",
      jsonKey: "frontend",
      icon: "code-2",
      accent: "violet",
      accentClass: "accent-violet",
      iconColor: "text-violet-400",
      arrowColor: "group-hover:text-violet-400"
    },
    ux: {
      label: "UX / UI Design",
      description: "Heurísticas, Figma e experiência do usuário.",
      jsonPath: "data/ux.json",
      jsonKey: "uxui",
      icon: "palette",
      accent: "fuchsia",
      accentClass: "accent-fuchsia",
      iconColor: "text-fuchsia-400",
      arrowColor: "group-hover:text-fuchsia-400"
    },
    engenharia: {
      label: "Engenharia de Software",
      description: "UML, requisitos, metodologias e qualidade de software.",
      jsonPath: "data/engenharia.json",
      jsonKey: "engenharia",
      icon: "git-branch",
      accent: "orange",
      accentClass: "accent-orange",
      iconColor: "text-orange-400",
      arrowColor: "group-hover:text-orange-400"
    },
    backend: {
      label: "Back End",
      description: "APIs, bancos de dados, C# e infraestrutura.",
      jsonPath: "data/backend.json",
      jsonKey: "backend",
      icon: "server",
      accent: "red",
      accentClass: "accent-red",
      iconColor: "text-red-400",
      arrowColor: "group-hover:text-red-400"
    },
    estruturas: {
      label: "Estruturas de Dados",
      description: "Filas, pilhas, árvores e algoritmos.",
      jsonPath: "data/estruturas.json",
      jsonKey: "estruturasDeDados",
      icon: "layers",
      accent: "yellow",
      accentClass: "accent-yellow",
      iconColor: "text-yellow-400",
      arrowColor: "group-hover:text-yellow-400"
    },
    adrii: {
      label: "Arquitetura de Dados Relacionais II",
      description: "Normalização, SQL avançado e modelagem de dados.",
      jsonPath: "data/adrii.json",
      jsonKey: "adrii",
      icon: "database",
      accent: "green",
      accentClass: "accent-green-dark",
      iconColor: "text-green-500",
      arrowColor: "group-hover:text-green-400"
    },
    sistemas: {
      label: "Sistemas Operacionais",
      description: "Processos, memória, arquivos e comandos Linux.",
      jsonPath: "data/sistemas.json",
      jsonKey: "sistemas",
      icon: "cpu",
      accent: "fuchsia",
      accentClass: "accent-fuchsia",
      iconColor: "text-fuchsia-400",
      arrowColor: "group-hover:text-fuchsia-400"
    },
    arquiteturasistemas: {
      label: "Arquitetura de Sistemas",
      description: "MVC, SOA, DevOps, componentes e arquiteturas distribuídas.",
      jsonPath: "data/arquiteturasistemas.json",
      jsonKey: "arquiteturaSistemas",
      icon: "blocks",
      accent: "red",
      accentClass: "accent-red",
      iconColor: "text-red-400",
      arrowColor: "group-hover:text-red-400"
    },
    fundamentosredes: {
      label: "Fundamentos de Redes",
      description: "TCP/IP, endereçamento, Ethernet, protocolos e redes sem fio.",
      jsonPath: "data/fundamentosredes.json",
      jsonKey: "fundamentosRedes",
      icon: "network",
      accent: "blue",
      accentClass: "accent-blue",
      iconColor: "text-blue-400",
      arrowColor: "group-hover:text-blue-400"
    },
    governancati: {
      label: "Governança de TI",
      description: "Alinhamento estratégico, compliance, riscos e geração de valor.",
      jsonPath: "data/governancati.json",
      jsonKey: "governancaTI",
      icon: "landmark",
      accent: "violet",
      accentClass: "accent-violet",
      iconColor: "text-violet-400",
      arrowColor: "group-hover:text-violet-400"
    },
    designthinking: {
      label: "Design Thinking",
      description: "Empatia, ideação, prototipagem e inovação.",
      jsonPath: "data/designthinking.json",
      jsonKey: "designThinking",
      icon: "lightbulb",
      accent: "lime",
      accentClass: "accent-lime",
      iconColor: "text-lime-400",
      arrowColor: "group-hover:text-lime-400"
    },
    logica: {
      label: "Lógica",
      description: "Proposições, algoritmos e pensamento computacional.",
      jsonPath: "data/logica.json",
      jsonKey: "logica",
      icon: "binary",
      accent: "blue",
      accentClass: "accent-blue",
      iconColor: "text-blue-400",
      arrowColor: "group-hover:text-blue-400"
    },
    estruturascc: {
      label: "Estruturas CC",
      description: "Pilhas, filas e análise de complexidade Big O.",
      jsonPath: "data/estruturascc.json",
      jsonKey: "estruturascc",
      icon: "layers-3",
      accent: "emerald",
      accentClass: "accent-emerald",
      iconColor: "text-emerald-400",
      arrowColor: "group-hover:text-emerald-400"
    }
  };

  const courses = {
    ADS: {
      label: "ADS",
      fullLabel: "Análise e Desenvolvimento de Sistemas",
      description: "Uma trilha prática para construir, projetar e sustentar produtos digitais.",
      subjects: [
        "frontend",
        "ux",
        "engenharia",
        "backend",
        "estruturas",
        "adrii",
        "sistemas",
        "arquiteturasistemas",
        "fundamentosredes",
        "governancati",
        "empreendedorismo",
        "apoiodecisao",
        "segurancainformacao"
      ],
      cardColors: [
        "#22d3ee",
        "#f472b6",
        "#fb923c",
        "#fb7185",
        "#facc15",
        "#34d399",
        "#818cf8",
        "#e11d48",
        "#0284c7",
        "#6d28d9",
        "#ea580c",
        "#059669",
        "#a855f7"
      ]
    },
    CC: {
      label: "CC",
      fullLabel: "Ciência da Computação",
      description: "Fundamentos, raciocínio e estruturas para compreender a computação por inteiro.",
      subjects: ["frontend", "ux", "designthinking", "backend", "logica", "estruturascc", "adrii", "sistemas", "engenharia", "estruturasdados2", "algebralinear"],
      cardColors: [
        "#38bdf8",
        "#c084fc",
        "#a3e635",
        "#e879f9",
        "#60a5fa",
        "#2dd4bf",
        "#4ade80",
        "#f87171",
        "#f59e0b",
        "#14b8a6",
        "#0891b2"
      ]
    }
  };

  window.DEVQUEST_SUBJECTS = Object.freeze(subjects);
  window.DEVQUEST_COURSES = Object.freeze(courses);
  window.DEVQUEST_FEATURED_SUBJECTS = Object.freeze([
    {
        "subjectId": "estruturasdados2",
        "courseId": "CC"
    },
    {
        "subjectId": "algebralinear",
        "courseId": "CC"
    },
    {
        "subjectId": "empreendedorismo",
        "courseId": "ADS"
    },
    {
        "subjectId": "apoiodecisao",
        "courseId": "ADS"
    },
    {
        "subjectId": "segurancainformacao",
        "courseId": "ADS"
    }
]);
  window.DEVQUEST_INFERNUS_SUBJECTS = Object.freeze([
    "frontend",
    "ux",
    "sistemas",
    "adrii",
    "engenharia",
    "backend",
    "estruturas",
    "designthinking",
    "logica",
    "estruturascc",
    "arquiteturasistemas",
    "fundamentosredes",
    "governancati",
    "estruturasdados2",
    "algebralinear",
    "empreendedorismo",
    "apoiodecisao",
    "segurancainformacao"
  ]);
})();
