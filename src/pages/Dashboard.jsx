import { useMemo, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const CATEGORIAS = [
  { key: "bebidas", label: "Bebidas (alcoólicas e não alcoólicas, água, refri, sucos etc)" },
  { key: "descartaveis", label: "Descartáveis (copos, pratos, papel toalha, guardanapo, palitos, canudos etc)" },
  { key: "bomboniere", label: "Bomboniere (doces, balas, chicletes, chocolates, bombons etc)" },
  { key: "cereais", label: "Cereais (feijão, arroz, farinha, açúcar, óleo, flocos de milho etc)" },
  { key: "oleos_especiais", label: "Óleos especiais (azeite, canola, milho etc)" },
  { key: "biscoitos", label: "Biscoitos (cream cracker, maria, maisena, integral, torradas, recheados etc)" },
  { key: "massas", label: "Massas e molhos (macarrão, lasanha, queijo ralado, molho, ketchup, mostarda, maionese etc)" },
  { key: "enlatados", label: "Enlatados (milho verde, azeitona, palmito, ervilhas etc)" },
  { key: "creme_leite", label: "Creme de leite e leite condensado" },
  { key: "matinais", label: "Matinais (café, chá, leite, café expresso, adoçante etc)" },
  { key: "higiene", label: "Higiene pessoal (absorvente, creme dental, shampoo, fraldas, papel higiênico etc)" },
  { key: "limpeza", label: "Limpeza (sabão em pó, detergente, água sanitária, vassouras, pano de chão etc)" },
  { key: "bazar", label: "Bazar (alumínio, panelas, pratos, talheres, copos, vidros etc)" },
  { key: "pet", label: "Pet (ração e acessórios)" },
  { key: "frios", label: "Frios e laticínios (iogurte, requeijão, margarina, ricota, leite etc)" },
  { key: "congelados", label: "Congelados (frango, hambúrguer, pizza, nugget, batata frita etc)" },
  { key: "acougue", label: "Açougue (carnes, costela, picanha, suíno, caprino, salsichas etc)" },
  { key: "churrasco", label: "Churrasco (carvão, espeto, grelhas, sal, temperos etc)" },
  { key: "salgados", label: "Salgados e embutidos (mortadela, salame, kit feijoada, charque, bacon etc)" },
  { key: "hortifruti", label: "Hortifruti (tomate, batata, banana, laranja, macaxeira, cenoura, beterraba etc)" },
  { key: "calcados", label: "Calçados (sandália, sapatos etc)" },
  { key: "adega", label: "Adega (vinhos, espumante, wisk(y), vodka, cachaça etc)" },
];

function emptyCategorias() {
  const obj = {};
  for (const c of CATEGORIAS) {
    obj[c.key] = { enabled: false, prateleiras: 0, observacao: "" };
  }
  return obj;
}

function baseProjeto() {
  return {
    nomeMercado: "",
    cidade: "",
    observacoes: "",

    // agora largura/comprimento ficam como parte dos "dados do mercado" também
    terrenoComprimento: "",
    terrenoLargura: "",

    // uploads
    fotosLocal: [], // File[]
    plantaBaixa: null, // File | null

    // submenu novos
    uploadTipo: "mercado", // mercado | gerar_ambiente | refazer_ambiente
    ambienteRefazer: "geral", // geral | entrada | caixas | corredores | hortifruti | acougue | limpeza | outro
    ambienteOutro: "",

    categorias: emptyCategorias(),
  };
}

const WEBHOOK_URL = "https://api.rota.valeia.space/webhook/rota/projeto";

export default function Dashboard() {
  const [projetos, setProjetos] = useState(() => {
    const saved = localStorage.getItem("rota_projetos");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "p1",
        nome: "Projeto Mercado 1",
        nomeManual: false, // <- novo: se true, não auto-sincroniza com nomeMercado
        dados: baseProjeto(),
      },
    ];
  });

  const [projetoIdAtual, setProjetoIdAtual] = useState(() => {
    return localStorage.getItem("rota_projeto_atual") || "p1";
  });

  const [ui, setUi] = useState({
    busy: false,
    msg: "",
    ok: true,
  });

  const projetoAtual = useMemo(
    () => projetos.find((p) => p.id === projetoIdAtual) || projetos[0],
    [projetos, projetoIdAtual]
  );

  function persist(nextProjetos, nextId = projetoIdAtual) {
    localStorage.setItem("rota_projetos", JSON.stringify(nextProjetos));
    localStorage.setItem("rota_projeto_atual", nextId);
  }

  function criarProjeto() {
    const novo = {
      id: `p${Date.now()}`,
      nome: "Novo Projeto",
      nomeManual: false,
      dados: baseProjeto(),
    };
    const next = [...projetos, novo];
    setProjetos(next);
    setProjetoIdAtual(novo.id);
    persist(next, novo.id);
  }

  function updateDados(patch) {
    const next = projetos.map((p) =>
      p.id === projetoIdAtual ? { ...p, dados: { ...p.dados, ...patch } } : p
    );
    setProjetos(next);
    persist(next);
  }

  function updateProjetoNome(nome) {
    const next = projetos.map((p) =>
      p.id === projetoIdAtual ? { ...p, nome, nomeManual: true } : p
    );
    setProjetos(next);
    persist(next);
  }

  function updateCategoria(key, patch) {
    const next = projetos.map((p) => {
      if (p.id !== projetoIdAtual) return p;
      return {
        ...p,
        dados: {
          ...p.dados,
          categorias: {
            ...p.dados.categorias,
            [key]: { ...p.dados.categorias[key], ...patch },
          },
        },
      };
    });
    setProjetos(next);
    persist(next);
  }

  // auto: nome do projeto = nomeMercado (se usuário não editou manualmente)
  useEffect(() => {
    const d = projetoAtual?.dados;
    if (!projetoAtual || !d) return;
    if (projetoAtual.nomeManual) return;

    const nomeMercado = (d.nomeMercado || "").trim();
    if (!nomeMercado) return;

    if (projetoAtual.nome !== nomeMercado) {
      const next = projetos.map((p) =>
        p.id === projetoIdAtual ? { ...p, nome: nomeMercado } : p
      );
      setProjetos(next);
      persist(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projetoAtual?.dados?.nomeMercado]);

  const selecionadas = useMemo(() => {
    const cats = projetoAtual?.dados?.categorias || {};
    return CATEGORIAS.filter((c) => cats[c.key]?.enabled);
  }, [projetoAtual]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function setMsg(ok, msg) {
    setUi({ busy: false, ok, msg });
    // some sozinho depois
    window.clearTimeout(window.__rota_msg_to);
    window.__rota_msg_to = window.setTimeout(() => {
      setUi((prev) => ({ ...prev, msg: "" }));
    }, 4500);
  }

  function buildBasePayload(bloco) {
    const d = projetoAtual.dados;
    return {
      bloco, // "dados_mercado" | "uploads" | "categorias" | "gerar"
      projetoId: projetoAtual.id,
      projetoNome: projetoAtual.nome,
      user: { email: "" }, // mantém compatível (você pode preencher depois via auth)
    };
  }

  async function postFormData(payload, files = {}) {
    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));

    // files: { fotosLocal: File[], plantaBaixa: File|null }
    if (files.fotosLocal && Array.isArray(files.fotosLocal)) {
      files.fotosLocal.forEach((file) => formData.append("fotosLocal", file, file.name));
    }
    if (files.plantaBaixa) {
      formData.append("plantaBaixa", files.plantaBaixa, files.plantaBaixa.name);
    }

    const res = await fetch(WEBHOOK_URL, { method: "POST", body: formData });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return text;
  }

  async function enviarDadosMercado() {
    const d = projetoAtual.dados;

    if (!d.nomeMercado?.trim()) {
      setMsg(false, "Preenche o nome do mercado antes, visse? 😅");
      return;
    }

    setUi({ busy: true, ok: true, msg: "Enviando dados do mercado..." });

    const payload = {
      ...buildBasePayload("dados_mercado"),
      nomeMercado: d.nomeMercado,
      cidade: d.cidade,
      observacoes: d.observacoes,
      terreno: {
        comprimento_m: d.terrenoComprimento,
        largura_m: d.terrenoLargura,
      },
    };

    try {
      await postFormData(payload);
      setMsg(true, "Dados do mercado enviados ✅");
    } catch (err) {
      console.error(err);
      setMsg(false, "Deu erro ao enviar os dados do mercado. Olha o console (F12).");
    }
  }

  async function enviarUploads() {
    const d = projetoAtual.dados;

    const temArquivos =
      (d.fotosLocal && d.fotosLocal.length > 0) || !!d.plantaBaixa;

    if (!temArquivos) {
      setMsg(false, "Seleciona pelo menos uma foto ou uma planta baixa, tá? 😅");
      return;
    }

    setUi({ busy: true, ok: true, msg: "Enviando uploads..." });

    const payload = {
      ...buildBasePayload("uploads"),
      uploads: {
        tipo: d.uploadTipo, // mercado | gerar_ambiente | refazer_ambiente
        ambiente: d.uploadTipo === "refazer_ambiente" ? d.ambienteRefazer : null,
        ambiente_outro:
          d.uploadTipo === "refazer_ambiente" && d.ambienteRefazer === "outro"
            ? d.ambienteOutro
            : null,
      },
    };

    try {
      await postFormData(payload, {
        fotosLocal: d.fotosLocal || [],
        plantaBaixa: d.plantaBaixa || null,
      });
      setMsg(true, "Uploads enviados ✅");
    } catch (err) {
      console.error(err);
      setMsg(false, "Deu erro ao enviar uploads. Olha o console (F12).");
    }
  }

  async function enviarCategorias() {
    const d = projetoAtual.dados;

    const catsSelecionadas = Object.fromEntries(
      Object.entries(d.categorias)
        .filter(([, v]) => v.enabled)
        .map(([k, v]) => [k, { prateleiras: v.prateleiras, observacao: v.observacao }])
    );

    if (Object.keys(catsSelecionadas).length === 0) {
      setMsg(false, "Marca pelo menos uma categoria antes de enviar, visse? 😅");
      return;
    }

    setUi({ busy: true, ok: true, msg: "Enviando categorias..." });

    const payload = {
      ...buildBasePayload("categorias"),
      categorias: catsSelecionadas,
    };

    try {
      await postFormData(payload);
      setMsg(true, "Categorias enviadas ✅");
    } catch (err) {
      console.error(err);
      setMsg(false, "Deu erro ao enviar categorias. Olha o console (F12).");
    }
  }

  // botão final (opcional): manda um "gerar" sem arquivos, só pra disparar o agente
  async function gerarTudo() {
    const d = projetoAtual.dados;

    setUi({ busy: true, ok: true, msg: "Disparando geração..." });

    const payload = {
      ...buildBasePayload("gerar"),
      nomeMercado: d.nomeMercado,
      cidade: d.cidade,
      observacoes: d.observacoes,
      terreno: {
        comprimento_m: d.terrenoComprimento,
        largura_m: d.terrenoLargura,
      },
      uploads: {
        tipo: d.uploadTipo,
        ambiente: d.uploadTipo === "refazer_ambiente" ? d.ambienteRefazer : null,
        ambiente_outro:
          d.uploadTipo === "refazer_ambiente" && d.ambienteRefazer === "outro"
            ? d.ambienteOutro
            : null,
      },
      categorias: Object.fromEntries(
        Object.entries(d.categorias)
          .filter(([, v]) => v.enabled)
          .map(([k, v]) => [k, { prateleiras: v.prateleiras, observacao: v.observacao }])
      ),
    };

    try {
      await postFormData(payload);
      setMsg(true, "Geração disparada ✅");
    } catch (err) {
      console.error(err);
      setMsg(false, "Erro ao disparar geração. Olha o console (F12).");
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-72 border-r border-zinc-900 bg-zinc-950/60">
          <div className="p-4">
            <div className="text-lg font-semibold">Rota</div>
            <div className="text-xs text-zinc-500">Projetos</div>
          </div>

          <button
            onClick={criarProjeto}
            className="mx-4 mb-3 w-[calc(100%-2rem)] rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2 text-sm"
          >
            + Novo projeto
          </button>

          <div className="max-h-[calc(100vh-190px)] overflow-auto">
            {projetos.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProjetoIdAtual(p.id);
                  localStorage.setItem("rota_projeto_atual", p.id);
                }}
                className={[
                  "w-full text-left px-4 py-3 text-sm border-b border-zinc-900",
                  projetoAtual?.id === p.id ? "bg-zinc-900/70" : "hover:bg-zinc-900/40",
                ].join(" ")}
              >
                {p.nome}
              </button>
            ))}
          </div>

          <div className="p-4">
            <button
              onClick={logout}
              className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2 text-sm"
            >
              Sair
            </button>
          </div>
        </aside>

        {/* Área principal */}
        <main className="flex-1 p-6">
          {/* Cabeçalho */}
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xl font-semibold">Projeto</div>

              <button
                onClick={gerarTudo}
                disabled={ui.busy}
                className={[
                  "rounded-xl px-4 py-2 text-sm border",
                  ui.busy
                    ? "bg-zinc-900 border-zinc-800 opacity-60 cursor-not-allowed"
                    : "bg-emerald-600/90 hover:bg-emerald-600 border-emerald-700",
                ].join(" ")}
              >
                {ui.busy ? "Aguarde..." : "Gerar"}
              </button>
            </div>

            {/* Mensagem inline (no lugar do alert) */}
            {ui.msg ? (
              <div
                className={[
                  "rounded-xl border px-4 py-3 text-sm",
                  ui.ok
                    ? "border-emerald-900 bg-emerald-950/40 text-emerald-200"
                    : "border-red-900 bg-red-950/40 text-red-200",
                ].join(" ")}
              >
                {ui.msg}
              </div>
            ) : null}

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="text-sm font-semibold mb-2">Nome do projeto (você pode renomear)</div>
              <input
                value={projetoAtual?.nome || ""}
                onChange={(e) => updateProjetoNome(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
                placeholder="Ex: Mercado Central - Layout Premium"
              />
              <div className="text-xs text-zinc-500 mt-2">
                Dica: se você não renomear manualmente, o nome do projeto vira o nome do mercado automaticamente.
              </div>
            </div>
          </div>

          {/* 1) Dados do mercado */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 mb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm font-semibold">1) Dados do mercado</div>
              <button
                onClick={enviarDadosMercado}
                disabled={ui.busy}
                className={[
                  "rounded-xl px-3 py-2 text-xs border",
                  ui.busy
                    ? "bg-zinc-900 border-zinc-800 opacity-60 cursor-not-allowed"
                    : "bg-zinc-950 hover:bg-zinc-900 border-zinc-800",
                ].join(" ")}
              >
                Enviar dados
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="md:col-span-2">
                <label className="block text-xs text-zinc-400 mb-1">Nome do mercado</label>
                <input
                  value={projetoAtual.dados.nomeMercado}
                  onChange={(e) => updateDados({ nomeMercado: e.target.value })}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
                  placeholder="Ex: Mercado São João"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Cidade</label>
                <input
                  value={projetoAtual.dados.cidade}
                  onChange={(e) => updateDados({ cidade: e.target.value })}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
                  placeholder="Ex: Petrolina/PE"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Comprimento do terreno (m)</label>
                <input
                  value={projetoAtual.dados.terrenoComprimento}
                  onChange={(e) => updateDados({ terrenoComprimento: e.target.value })}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
                  placeholder="Ex: 30"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Largura do terreno (m)</label>
                <input
                  value={projetoAtual.dados.terrenoLargura}
                  onChange={(e) => updateDados({ terrenoLargura: e.target.value })}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
                  placeholder="Ex: 18"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-zinc-400 mb-1">Observações (opcional)</label>
                <textarea
                  value={projetoAtual.dados.observacoes}
                  onChange={(e) => updateDados({ observacoes: e.target.value })}
                  className="w-full min-h-24 rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
                  placeholder="Ex: Quero um layout moderno, com ilha promocional na entrada..."
                />
                <div className="text-xs text-zinc-500 mt-2">
                  Se não souber as medidas exatas, bota aproximado. Isso já ajuda o agente demais.
                </div>
              </div>
            </div>
          </section>

          {/* 2) Uploads */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 mb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm font-semibold">2) Uploads</div>
              <button
                onClick={enviarUploads}
                disabled={ui.busy}
                className={[
                  "rounded-xl px-3 py-2 text-xs border",
                  ui.busy
                    ? "bg-zinc-900 border-zinc-800 opacity-60 cursor-not-allowed"
                    : "bg-zinc-950 hover:bg-zinc-900 border-zinc-800",
                ].join(" ")}
              >
                Enviar uploads
              </button>
            </div>

            {/* submenu */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs text-zinc-400 mb-2">Tipo de upload</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: "mercado", t: "Mercado (fotos do local)" },
                    { v: "gerar_ambiente", t: "Geração do ambiente" },
                    { v: "refazer_ambiente", t: "Refazer ambiente" },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => updateDados({ uploadTipo: opt.v })}
                      className={[
                        "rounded-xl px-3 py-2 text-xs border",
                        projetoAtual.dados.uploadTipo === opt.v
                          ? "bg-emerald-600/20 border-emerald-800 text-emerald-200"
                          : "bg-zinc-950 border-zinc-800 hover:bg-zinc-900",
                      ].join(" ")}
                    >
                      {opt.t}
                    </button>
                  ))}
                </div>
              </div>

              {projetoAtual.dados.uploadTipo === "refazer_ambiente" ? (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-zinc-400 mb-1">Qual ambiente você quer refazer?</label>
                    <select
                      value={projetoAtual.dados.ambienteRefazer}
                      onChange={(e) => updateDados({ ambienteRefazer: e.target.value })}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
                    >
                      <option value="geral">Geral</option>
                      <option value="entrada">Entrada</option>
                      <option value="caixas">Caixas</option>
                      <option value="corredores">Corredores</option>
                      <option value="hortifruti">Hortifruti</option>
                      <option value="acougue">Açougue</option>
                      <option value="limpeza">Limpeza</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  {projetoAtual.dados.ambienteRefazer === "outro" ? (
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Especifica</label>
                      <input
                        value={projetoAtual.dados.ambienteOutro}
                        onChange={(e) => updateDados({ ambienteOutro: e.target.value })}
                        className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
                        placeholder="Ex: corredor de bebidas"
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 flex items-end">
                      Dica: manda fotos só do ambiente alvo, se puder.
                    </div>
                  )}
                </>
              ) : (
                <div className="md:col-span-3 text-xs text-zinc-500">
                  Selecione o tipo acima e envie as fotos/planta abaixo.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Fotos do local (pode subir várias)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => updateDados({ fotosLocal: Array.from(e.target.files || []) })}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm"
                />
                <div className="text-xs text-zinc-500 mt-1">
                  Selecionadas: {projetoAtual.dados.fotosLocal?.length || 0}
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Planta baixa (se tiver)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) =>
                    updateDados({
                      plantaBaixa: (e.target.files && e.target.files[0]) || null,
                    })
                  }
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm"
                />
                <div className="text-xs text-zinc-500 mt-1">
                  {projetoAtual.dados.plantaBaixa
                    ? `Arquivo: ${projetoAtual.dados.plantaBaixa.name}`
                    : "Nenhum arquivo selecionado"}
                </div>
              </div>
            </div>
          </section>

          {/* 3) Categorias e prateleiras */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm font-semibold">3) Categorias e prateleiras</div>
              <button
                onClick={enviarCategorias}
                disabled={ui.busy}
                className={[
                  "rounded-xl px-3 py-2 text-xs border",
                  ui.busy
                    ? "bg-zinc-900 border-zinc-800 opacity-60 cursor-not-allowed"
                    : "bg-zinc-950 hover:bg-zinc-900 border-zinc-800",
                ].join(" ")}
              >
                Enviar categorias
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
              {CATEGORIAS.map((c) => {
                const v = projetoAtual.dados.categorias[c.key];
                return (
                  <div
                    key={c.key}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3"
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!v.enabled}
                        onChange={(e) =>
                          updateCategoria(c.key, { enabled: e.target.checked })
                        }
                        className="mt-1"
                      />
                      <div>
                        <div className="text-sm font-medium">{c.label}</div>
                        <div className="text-xs text-zinc-500">
                          Marque se essa categoria vai existir no mercado.
                        </div>
                      </div>
                    </label>

                    {v.enabled ? (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">
                            Qtde de prateleiras/gôndolas
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={v.prateleiras}
                            onChange={(e) =>
                              updateCategoria(c.key, {
                                prateleiras: Number(e.target.value || 0),
                              })
                            }
                            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
                            placeholder="Ex: 4"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">
                            Observação
                          </label>
                          <input
                            value={v.observacao}
                            onChange={(e) =>
                              updateCategoria(c.key, { observacao: e.target.value })
                            }
                            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
                            placeholder="Ex: perto do caixa"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="text-xs text-zinc-500 mt-3">
              Categorias selecionadas: {selecionadas.length}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
