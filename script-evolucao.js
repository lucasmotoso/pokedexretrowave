const searchInput = document.getElementById("searchInput");
const suggestionsList = document.getElementById("suggestions");
const evolutionDisplay = document.getElementById("evolution-display");
const scanButton = document.querySelector(".btn:nth-child(1)");

let allPokemonNames = [];
let lastLoadedPokemon = null; // <- nova variável de controle

// ============================
// Autocomplete
// ============================
async function fetchAllPokemonNames() {
  try {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
    const data = await response.json();
    allPokemonNames = data.results.map(p => p.name);
  } catch (err) {
    console.error("Erro ao buscar Pokémon:", err);
  }
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase().trim();
  suggestionsList.innerHTML = "";
  if (!query) return;

  const filtered = allPokemonNames.filter(name => name.startsWith(query)).slice(0, 10);
  filtered.forEach(name => {
    const li = document.createElement("li");
    li.textContent = capitalize(name);
    li.addEventListener("click", () => {
      suggestionsList.innerHTML = "";
      searchInput.value = capitalize(name);
      if (name.toLowerCase() !== lastLoadedPokemon) {
        loadEvolutionChain(name.toLowerCase());
      }
    });
    suggestionsList.appendChild(li);
  });
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const query = searchInput.value.toLowerCase().trim();
    if (query !== "" && query !== lastLoadedPokemon) {
      suggestionsList.innerHTML = "";
      loadEvolutionChain(query);
    }
  }
});

// ============================
// Botão SCAN
// ============================
scanButton.addEventListener("click", () => {
  const query = searchInput.value.toLowerCase().trim();
  if (query && query !== lastLoadedPokemon) {
    loadEvolutionChain(query);
  }
});

// ============================
// Carregar e renderizar cadeia
// ============================
async function loadEvolutionChain(pokemonName) {
  if (pokemonName === lastLoadedPokemon) return;
  lastLoadedPokemon = pokemonName;

  evolutionDisplay.innerHTML = `<p>🔄 Carregando evolução de ${capitalize(pokemonName)}...</p>`;
  document.querySelector(".status-bar")?.classList.remove("hidden");

  try {
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`);
    const speciesData = await speciesRes.json();
    const evoUrl = speciesData.evolution_chain.url;

    const evoRes = await fetch(evoUrl);
    const evoData = await evoRes.json();

    const chain = parseEvolutionChain(evoData.chain);
    evolutionDisplay.innerHTML = ""; // Limpa a tela antes de renderizar
    await renderEvolutionChain(chain);

    document.querySelector(".status-bar")?.classList.add("hidden");
  } catch (err) {
    console.error("Erro ao carregar evolução:", err);
    evolutionDisplay.innerHTML = `<p style="color: red;">❌ Pokémon não encontrado</p>`;
    document.querySelector(".status-bar")?.classList.add("hidden");
  }
}

// ============================
// Interpretar com ramificações
// ============================
function parseEvolutionChain(chainNode) {
  function recurse(node) {
    const name = node.species.name;
    const evolutionDetails = node.evolution_details?.[0];
    const condition = evolutionDetails?.min_level
      ? `Lvl ${evolutionDetails.min_level}`
      : evolutionDetails?.item
        ? `Item: ${capitalize(evolutionDetails.item.name)}`
        : "Base";

    return {
      name,
      condition,
      evolves_to: node.evolves_to.map(recurse)
    };
  }

  return [recurse(chainNode)];
}

// ============================
// Renderizar árvore com colunas
// ============================
async function renderEvolutionChain(chain) {
  evolutionDisplay.innerHTML = "";

  async function renderNode(stage, container) {
    const pokeData = await fetch(`https://pokeapi.co/api/v2/pokemon/${stage.name}`).then(res => res.json());

    const card = document.createElement("div");
    card.className = "evo-card";
    card.innerHTML = `
      <img src="${pokeData.sprites.front_default || ''}" alt="${pokeData.name}" />
      <div class="info">
        <span class="poke-name">${capitalize(pokeData.name)}</span>
        <span class="poke-id">#${pokeData.id}</span>
        <span class="condition">${stage.condition}</span>
      </div>
    `;
    card.addEventListener("click", () => {
      window.location.href = `index.html?pokemon=${stage.name}`;
    });

    const wrapper = document.createElement("div");
    wrapper.className = "evo-wrapper";
    wrapper.appendChild(card);

    if (stage.evolves_to.length > 0) {
      const arrow = document.createElement("div");
      arrow.className = "arrow-down";
      arrow.innerHTML = "⬇️";
      wrapper.appendChild(arrow);

      const branch = document.createElement("div");
      branch.className = "evo-branch";

      for (const child of stage.evolves_to) {
        await renderNode(child, branch);
      }

      wrapper.appendChild(branch);
    }

    container.appendChild(wrapper);
  }

  await renderNode(chain[0], evolutionDisplay);
}

// ============================
// Utilitário
// ============================
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================
// Inicialização
// ============================
fetchAllPokemonNames();

window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const pokemonFromURL = params.get("pokemon");
  if (pokemonFromURL && pokemonFromURL.toLowerCase() !== lastLoadedPokemon) {
    searchInput.value = capitalize(pokemonFromURL);
    loadEvolutionChain(pokemonFromURL.toLowerCase());
  }
});

document.getElementById("backToPokedex").addEventListener("click", () => {
  window.location.href = "index.html";
});
