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

    // medidas do terreno
    terrenoComprimento: "",
    terrenoLargura: "",

    // uploads (somente IMAGENS, 1 por campo)
    logo: null,   // File|null
    planta: null, // File|null
    campoC: null, // File|null
    campoD: null, // File|null
    campoE: null, // File|null

    categorias: emptyCategorias(),
  };
}

// usa env, com fallback
const WEBHOOK_URL =
  import.meta.env.VITE_N8N_WEBHOOK_URL ||
  "https://api.rota.valeia.space/webhook/rota/projeto";

function sanitizeForStorage(projetos) {
  // NÃO salva File no localStorage (isso quebra tudo depois)
  return projetos.map((p) => ({
    ...p,
    dados: {
      ...p.dados,
      logo: null,
      planta: null,
      campoC: null,
      campoD: null,
      campoE: null,
    },
  }));
}

export default function Dashboard() {
  const [projetos, setProjetos] = useState(() => {
    const saved = localStorage.getItem("rota_projetos");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((p) => ({
        ...p,
        dados: {
          ...baseProjeto(),
          ...(p.dados || {}),
          // BLINDAGEM: sempre limpa files ao carregar
          logo: null,
          planta: null,
          campoC: null,
          campoD: null,
          campoE: null,
        },
      }));
    }
    return [
      {
        id: "p1",
        nome: "Projeto Mercado 1",
        nomeManual: false,
        dados: baseProjeto(),
      },
    ];
  });

  const [projetoIdAtual, setProjetoIdAtual] = useState(() => {
    return localStorage.getItem("rota_projeto_atual") || "p1";
  });

  const [ui, setUi] = useState({ busy: false, msg: "", ok: true });

  const projetoAtual = useMemo(
    () => projetos.find((p) => p.id === projetoIdAtual) || projetos[0],
    [projetos, projetoIdAtual]
  );

  function persist(nextProjetos, nextId = projetoIdAtual) {
    const safe = sanitizeForStorage(nextProjetos);
    localStorage.setItem("rota_projetos", JSON.stringify(safe));
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
    window.clearTimeout(window.__rota_msg_to);
    window.__rota_msg_to = window.setTimeout(() => {
      setUi((prev) => ({ ...prev, msg: "" }));
    }, 4500);
  }

  function catsSelecionadasPayload() {
    const d = projetoAtual.dados;
    return Object.fromEntries(
      Object.entries(d.categorias)
        .filter(([, v]) => v.enabled)
        .map(([k, v]) => [k, { prateleiras: v.prateleiras, observacao: v.observacao }])
    );
  }

  async function postFormDataTudo(payload, files) {
    const fd = new FormData();
    fd.append("data", JSON.stringify(payload));

    // chaves FIXAS (pra tu bater com o n8n sem sofrimento)
    if (files.logo instanceof File) fd.append("logo", files.logo, files.logo.name);
    if (files.planta instanceof File) fd.append("planta", files.planta, files.planta.name);
    if (files.campoC instanceof File) fd.append("campoC", files.campoC, files.campoC.name);
    if (files.campoD instanceof File) fd.append("campoD", files.campoD, files.campoD.name);
    if (files.campoE instanceof File) fd.append("campoE", files.campoE, files.campoE.name);

    const res = await fetch(WEBHOOK_URL, { method: "POST", body: fd });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return text;
  }

  // ✅ botão único: manda TUDO em 1 POST (e pronto)
  async function gerarTudo() {
    const d = projetoAtual.dados;

    if (!d.nomeMercado?.trim()) {
      setMsg(false, "Preenche o nome do mercado antes, visse? 😅");
      return;
    }

    setUi({ busy: true, ok: true, msg: "Enviando… (dados + imagens + categorias)" });

    const payload = {
      bloco: "gerar",
      projetoId: projetoAtual.id,
      projetoNome: projetoAtual.nome,
      user: { email: "" },

      nomeMercado: d.nomeMercado,
      cidade: d.cidade,
      observacoes: d.observacoes,

      terreno: {
        comprimento_m: d.terrenoComprimento,
        largura_m: d.terrenoLargura,
      },

      categorias: catsSelecionadasPayload(),

      // só pra debug/clareza do agente
      uploads: {
        logo: !!d.logo,
        planta: !!d.planta,
        campoC: !!d.campoC,
        campoD: !!d.campoD,
        campoE: !!d.campoE,
      },
    };

    try {
      await postFormDataTudo(payload, {
        logo: d.logo,
        planta: d.planta,
        campoC: d.campoC,
        campoD: d.campoD,
        campoE: d.campoE,
      });

      setMsg(true, "Sucesso ✅ Enviado pro n8n!");
    } catch (err) {
      console.error(err);
      setMsg(false, "Deu erro no envio. Abre o console (F12) e me manda a linha do erro.");
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="md:w-72 w-full border-b md:border-b-0 md:border-r border-zinc-900 bg-zinc-950/60">
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

          <div className="max-h-[280px] md:max-h-[calc(100vh-190px)] overflow-auto">
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
        <main className="flex-1 p-4 md:p-6 pb-28">
          <div className="mb-4 flex flex-col gap-3">
            <div className="text-xl font-semibold">Projeto</div>

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
            <div className="text-sm font-semibold">1) Dados do mercado</div>

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
              </div>
            </div>
          </section>

          {/* 2) Uploads (A-E, 1 imagem por campo) */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 mb-4">
            <div className="text-sm font-semibold">2) Uploads (1 imagem por campo)</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Campo A — Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => updateDados({ logo: (e.target.files && e.target.files[0]) || null })}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm"
                />
                <div className="text-xs text-zinc-500 mt-1">
                  {projetoAtual.dados.logo ? `Arquivo: ${projetoAtual.dados.logo.name}` : "Nenhuma imagem selecionada"}
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Campo B — Planta baixa</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => updateDados({ planta: (e.target.files && e.target.files[0]) || null })}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm"
                />
                <div className="text-xs text-zinc-500 mt-1">
                  {projetoAtual.dados.planta ? `Arquivo: ${projetoAtual.dados.planta.name}` : "Nenhuma imagem selecionada"}
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Campo C — Imagem</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => updateDados({ campoC: (e.target.files && e.target.files[0]) || null })}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm"
                />
                <div className="text-xs text-zinc-500 mt-1">
                  {projetoAtual.dados.campoC ? `Arquivo: ${projetoAtual.dados.campoC.name}` : "Nenhuma imagem selecionada"}
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Campo D — Imagem</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => updateDados({ campoD: (e.target.files && e.target.files[0]) || null })}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm"
                />
                <div className="text-xs text-zinc-500 mt-1">
                  {projetoAtual.dados.campoD ? `Arquivo: ${projetoAtual.dados.campoD.name}` : "Nenhuma imagem selecionada"}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-zinc-400 mb-1">Campo E — Imagem</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => updateDados({ campoE: (e.target.files && e.target.files[0]) || null })}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm"
                />
                <div className="text-xs text-zinc-500 mt-1">
                  {projetoAtual.dados.campoE ? `Arquivo: ${projetoAtual.dados.campoE.name}` : "Nenhuma imagem selecionada"}
                </div>
              </div>

              <div className="md:col-span-2 text-xs text-zinc-500">
                No n8n, as chaves vão chegar exatamente assim: <b>logo</b>, <b>planta</b>, <b>campoC</b>, <b>campoD</b>, <b>campoE</b>.
              </div>
            </div>
          </section>

          {/* 3) Categorias e prateleiras */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="text-sm font-semibold">3) Categorias e prateleiras</div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
              {CATEGORIAS.map((c) => {
                const v = projetoAtual.dados.categorias[c.key];
                return (
                  <div key={c.key} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!v.enabled}
                        onChange={(e) => updateCategoria(c.key, { enabled: e.target.checked })}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-sm font-medium">{c.label}</div>
                        <div className="text-xs text-zinc-500">Marque se essa categoria vai existir no mercado.</div>
                      </div>
                    </label>

                    {v.enabled ? (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Qtde de prateleiras/gôndolas</label>
                          <input
                            type="number"
                            min={0}
                            value={v.prateleiras}
                            onChange={(e) => updateCategoria(c.key, { prateleiras: Number(e.target.value || 0) })}
                            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
                            placeholder="Ex: 4"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Observação</label>
                          <input
                            value={v.observacao}
                            onChange={(e) => updateCategoria(c.key, { observacao: e.target.value })}
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

          {/* botão final fixo */}
          <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-900 bg-black/70 backdrop-blur">
            <div className="max-w-[1200px] mx-auto p-3 flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">
                {ui.busy ? "Processando…" : "Tudo pronto? Clique em Gerar."}
              </div>

              <button
                onClick={gerarTudo}
                disabled={ui.busy}
                className={[
                  "rounded-xl px-5 py-3 text-sm border font-semibold",
                  ui.busy
                    ? "bg-zinc-900 border-zinc-800 opacity-60 cursor-not-allowed"
                    : "bg-emerald-600/90 hover:bg-emerald-600 border-emerald-700",
                ].join(" ")}
              >
                {ui.busy ? "Aguarde..." : "Gerar"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
