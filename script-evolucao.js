const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestions');
const evolutionDisplay = document.getElementById('evolution-display');
const statusFill = document.getElementById('status-fill');
const themeToggle = document.getElementById('theme-toggle');
const menuToggle = document.getElementById('menu-toggle');
const pokedexNav = document.getElementById('pokedex-nav');
const backToPokedexBtn = document.getElementById('backToPokedex');

let allPokemonNames = [];
let lastLoadedPokemon = null;
let searchTimeout = null;

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function capitalizeWords(str) {
  return str.split('-').map(word => capitalize(word)).join('-');
}

function showLoading() {
  statusFill.classList.add('active');
  evolutionDisplay.innerHTML = `
    <div class="loading-evo">
      <div class="loading-spinner-evo"></div>
      <span>ANALISANDO CADEIA...</span>
    </div>
  `;
}

function hideLoading() {
  statusFill.classList.remove('active');
}

async function fetchAllPokemonNames() {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
    const data = await response.json();
    allPokemonNames = data.results.map(p => ({
      name: p.name,
      url: p.url
    }));
  } catch (err) {
    console.error('Erro ao buscar nomes:', err);
  }
}

function showSuggestions(query) {
  suggestionsList.innerHTML = '';
  
  if (query.length < 2) {
    suggestionsList.classList.remove('show');
    return;
  }

  const filtered = allPokemonNames
    .filter(p => p.name.toLowerCase().startsWith(query.toLowerCase()))
    .slice(0, 8);

  if (filtered.length === 0) {
    suggestionsList.classList.remove('show');
    return;
  }

  filtered.forEach((pokemon, index) => {
    const li = document.createElement('li');
    li.textContent = capitalize(pokemon.name);
    li.addEventListener('click', () => {
      searchInput.value = capitalize(pokemon.name);
      suggestionsList.classList.remove('show');
      loadEvolutionChain(pokemon.name);
    });
    
    if (index === 0) {
      li.classList.add('highlighted');
    }
    
    suggestionsList.appendChild(li);
  });

  suggestionsList.classList.add('show');
}

searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();
  
  searchTimeout = setTimeout(() => {
    showSuggestions(query);
  }, 150);
});

searchInput.addEventListener('keydown', (e) => {
  const highlighted = suggestionsList.querySelector('.highlighted');
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (highlighted && highlighted.nextElementSibling) {
      highlighted.classList.remove('highlighted');
      highlighted.nextElementSibling.classList.add('highlighted');
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (highlighted && highlighted.previousElementSibling) {
      highlighted.classList.remove('highlighted');
      highlighted.previousElementSibling.classList.add('highlighted');
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (highlighted) {
      highlighted.click();
    } else {
      const query = searchInput.value.trim();
      if (query && query !== lastLoadedPokemon) {
        loadEvolutionChain(query);
        suggestionsList.classList.remove('show');
      }
    }
  } else if (e.key === 'Escape') {
    suggestionsList.classList.remove('show');
    searchInput.blur();
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrapper') && !e.target.closest('.suggestions-list')) {
    suggestionsList.classList.remove('show');
  }
});

async function loadEvolutionChain(pokemonName) {
  if (pokemonName === lastLoadedPokemon) return;
  lastLoadedPokemon = pokemonName;
  
  showLoading();

  try {
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName.toLowerCase()}`);
    
    if (!speciesRes.ok) {
      throw new Error('Pokémon não encontrado');
    }
    
    const speciesData = await speciesRes.json();
    const evoUrl = speciesData.evolution_chain.url;

    const evoRes = await fetch(evoUrl);
    const evoData = await evoRes.json();

    const chain = parseEvolutionChain(evoData.chain);
    await renderEvolutionChain(chain);

    hideLoading();

  } catch (err) {
    console.error('Erro ao carregar evolução:', err);
    hideLoading();
    evolutionDisplay.innerHTML = `
      <div class="error-message">
        <div class="error-icon">⚠</div>
        <p>${err.message || 'Erro ao carregar dados'}</p>
      </div>
    `;
  }
}

function parseEvolutionChain(chainNode) {
  function recurse(node) {
    const name = node.species.name;
    const evolutionDetails = node.evolution_details?.[0];
    
    let condition = 'Forma base';
    if (evolutionDetails) {
      if (evolutionDetails.min_level) {
        condition = `Nível ${evolutionDetails.min_level}`;
      } else if (evolutionDetails.item) {
        condition = `Usar ${capitalizeWords(evolutionDetails.item.name)}`;
      } else if (evolutionDetails.trigger?.name === 'trade') {
        condition = 'Troca';
      } else if (evolutionDetails.min_happiness) {
        condition = 'Felicidade+';
      } else if (evolutionDetails.time_of_day) {
        condition = evolutionDetails.time_of_day === 'day' ? 'Dia' : 'Noite';
      } else if (evolutionDetails.known_move_type) {
        condition = `Tipo ${capitalizeWords(evolutionDetails.known_move_type.name)}`;
      } else if (evolutionDetails.held_item) {
        condition = `Segurar ${capitalizeWords(evolutionDetails.held_item.name)}`;
      } else if (evolutionDetails.location) {
        condition = 'Local específico';
      }
    }

    return {
      name,
      condition,
      evolves_to: node.evolves_to.map(recurse)
    };
  }

  return [recurse(chainNode)];
}

async function renderEvolutionChain(chain) {
  evolutionDisplay.innerHTML = '';

  async function renderNode(stage, container, isRoot = false) {
    const pokeData = await fetch(`https://pokeapi.co/api/v2/pokemon/${stage.name}`).then(res => res.json());

    const card = document.createElement('div');
    card.className = 'evo-card';
    card.innerHTML = `
      <img src="${pokeData.sprites.other['official-artwork'].front_default || pokeData.sprites.front_default}" alt="${pokeData.name}" loading="lazy" />
      <div class="info">
        <span class="poke-name">${capitalize(pokeData.name)}</span>
        <span class="poke-id">#${String(pokeData.id).padStart(3, '0')}</span>
        <span class="condition">${stage.condition}</span>
      </div>
    `;
    
    card.addEventListener('click', () => {
      const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
      window.location.href = `${basePath}/index.html?pokemon=${stage.name}`;
    });

    const stageDiv = document.createElement('div');
    stageDiv.className = 'evo-stage';
    stageDiv.appendChild(card);

    if (stage.evolves_to.length > 0) {
      const arrow = document.createElement('div');
      arrow.className = 'evo-arrow';
      arrow.innerHTML = '⬇';
      stageDiv.appendChild(arrow);

      const branch = document.createElement('div');
      branch.className = 'evo-branch';

      for (const child of stage.evolves_to) {
        await renderNode(child, branch);
      }

      stageDiv.appendChild(branch);
    }

    container.appendChild(stageDiv);
  }

  const chainContainer = document.createElement('div');
  chainContainer.className = 'evo-chain';
  
  await renderNode(chain[0], chainContainer, true);
  
  evolutionDisplay.appendChild(chainContainer);
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    const icon = themeToggle.querySelector('.theme-icon');
    icon.textContent = isLight ? '☀' : '◐';
    
    if (isLight) {
      document.body.style.backgroundImage = "url('./imagens/background1.png')";
    } else {
      document.body.style.backgroundImage = "url('./imagens/background2.png')";
    }
  });
}

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    pokedexNav.classList.toggle('open');
  });
}

if (backToPokedexBtn) {
  backToPokedexBtn.addEventListener('click', () => {
    const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
    window.location.href = `${basePath}/index.html`;
  });
}

async function init() {
  await fetchAllPokemonNames();

  const params = new URLSearchParams(window.location.search);
  const pokemonParam = params.get('pokemon');
  
  if (pokemonParam && pokemonParam.toLowerCase() !== lastLoadedPokemon) {
    searchInput.value = capitalize(pokemonParam);
    loadEvolutionChain(pokemonParam.toLowerCase());
  }
}

init();