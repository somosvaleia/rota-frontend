import { useMemo, useState } from "react";

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

export default function Dashboard({ user, onLogout }) {
  const [projetos, setProjetos] = useState([
    {
      id: "p1",
      nome: "Projeto Mercado 1",
      dados: {
        nomeMercado: "",
        cidade: "",
        observacoes: "",
        fotosLocal: [], // File[]
        plantaBaixa: null, // File
        categorias: emptyCategorias(),
      },
    },
  ]);

  const [projetoIdAtual, setProjetoIdAtual] = useState("p1");

  const projetoAtual = useMemo(
    () => projetos.find((p) => p.id === projetoIdAtual) || projetos[0],
    [projetos, projetoIdAtual]
  );

  function criarProjeto() {
    const novo = {
      id: `p${Date.now()}`,
      nome: "Novo Projeto",
      dados: {
        nomeMercado: "",
        cidade: "",
        observacoes: "",
        fotosLocal: [],
        plantaBaixa: null,
        categorias: emptyCategorias(),
      },
    };
    setProjetos((prev) => [...prev, novo]);
    setProjetoIdAtual(novo.id);
  }

  function updateDados(patch) {
    setProjetos((prev) =>
      prev.map((p) =>
        p.id === projetoIdAtual
          ? { ...p, dados: { ...p.dados, ...patch } }
          : p
      )
    );
  }

  function updateCategoria(key, patch) {
    setProjetos((prev) =>
      prev.map((p) => {
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
      })
    );
  }

  const selecionadas = useMemo(() => {
    const cats = projetoAtual?.dados?.categorias || {};
    return CATEGORIAS.filter((c) => cats[c.key]?.enabled);
  }, [projetoAtual]);

  // (por enquanto) simula envio; depois ligamos no n8n
async function salvarProjeto(e) {
  e.preventDefault();

  const d = projetoAtual.dados;

  const payload = {
    projetoId: projetoAtual.id,
    projetoNome: projetoAtual.nome,
    user: { email: user?.email || "" },
    nomeMercado: d.nomeMercado,
    cidade: d.cidade,
    observacoes: d.observacoes,
    categorias: Object.fromEntries(
      Object.entries(d.categorias)
        .filter(([, v]) => v.enabled)
        .map(([k, v]) => [k, { prateleiras: v.prateleiras, observacao: v.observacao }])
    ),
  };

  // 🔥 Envio multipart: dados + arquivos
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));

  // Fotos do local (múltiplas)
  (d.fotosLocal || []).forEach((file) => {
    formData.append("fotosLocal", file, file.name);
  });

  // Planta baixa (opcional)
  if (d.plantaBaixa) {
    formData.append("plantaBaixa", d.plantaBaixa, d.plantaBaixa.name);
  }

  // ⚠️ TESTE: use webhook-test enquanto o workflow tá em "Listen"
  const WEBHOOK_URL = "https://api.rota.valeia.space/webhook-test/rota/projeto";

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      body: formData,
    });

    const text = await res.text();
    alert(`Enviado pro n8n ✅\nStatus: ${res.status}\n\nResposta:\n${text}`);
  } catch (err) {
    console.error(err);
    alert("Deu ruim no envio 😵\nOlha o console (F12) pra ver o erro.");
  }
}

  return (
    <div className="h-screen flex bg-zinc-950 text-white">
      {/* Sidebar */}
      <aside className="w-72 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="text-lg font-semibold">Rota</div>
          <div className="text-xs text-zinc-400">{user?.email}</div>
        </div>

        <div className="p-4">
          <button
            onClick={criarProjeto}
            className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
          >
            + Novo projeto
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {projetos.map((p) => (
            <button
              key={p.id}
              onClick={() => setProjetoIdAtual(p.id)}
              className={[
                "w-full text-left px-4 py-3 text-sm border-b border-zinc-900",
                projetoAtual?.id === p.id
                  ? "bg-zinc-900/70"
                  : "hover:bg-zinc-900/40",
              ].join(" ")}
            >
              {p.nome}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={onLogout}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm hover:bg-zinc-900"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Área principal */}
      <main className="flex-1 p-6 overflow-auto">
        <h2 className="text-xl font-semibold">{projetoAtual?.nome}</h2>
        <p className="text-zinc-400 mt-2">
          Preenche aqui as infos do projeto. Depois a gente envia isso pro n8n pra gerar 3D e vídeo drone.
        </p>

        <form onSubmit={salvarProjeto} className="mt-6 space-y-6">
          {/* Bloco: dados básicos */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="text-sm font-semibold mb-3">Dados do mercado</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
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

          {/* Bloco: uploads */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="text-sm font-semibold mb-3">Uploads</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <label className="block text-xs text-zinc-400 mb-1">
                  Planta baixa (se tiver)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => updateDados({ plantaBaixa: (e.target.files && e.target.files[0]) || null })}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm"
                />
                <div className="text-xs text-zinc-500 mt-1">
                  {projetoAtual.dados.plantaBaixa ? `Arquivo: ${projetoAtual.dados.plantaBaixa.name}` : "Nenhum arquivo selecionado"}
                </div>
              </div>
            </div>
          </section>

          {/* Bloco: categorias */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="text-sm font-semibold mb-3">Categorias e prateleiras</div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
                        <div className="text-xs text-zinc-500">
                          Marque se essa categoria vai existir no mercado.
                        </div>
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

          {/* Ações */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="text-xs text-zinc-500">
              *Por enquanto o botão só mostra o payload. Depois a gente envia pro n8n.
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl bg-white text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
              >
                Salvar e gerar (teste)
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
