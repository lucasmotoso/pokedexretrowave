const pokemonDisplay = document.getElementById('pokemon-display');
const nameEl = document.getElementById('pokemon-name');
const typeEl = document.getElementById('pokemon-type');
const idEl = document.getElementById('pokemon-id');
const heightEl = document.getElementById('pokemon-height');
const weightEl = document.getElementById('pokemon-weight');
const abilitiesEl = document.getElementById('pokemon-abilities');
const baseStatsEl = document.getElementById('pokemon-base-stats');
const toggleThemeBtn = document.getElementById('toggle-theme');
const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestions');
const statusFill = document.getElementById('status-fill');
const menuToggle = document.getElementById('menu-toggle');
const pokedexNav = document.getElementById('pokedex-nav');

let currentId = 1;
let allPokemonNames = [];
let isLoading = false;
let searchTimeout = null;
let currentPokemonData = null;

const statTranslations = {
  hp: 'HP',
  attack: 'ATAQUE',
  defense: 'DEFESA',
  'special-attack': 'ATQ.ESP',
  'special-defense': 'DEF.ESP',
  speed: 'VELOCIDADE'
};

const typeTranslations = {
  normal: 'Normal',
  fire: 'Fogo',
  water: 'Água',
  electric: 'Elétrico',
  grass: 'Planta',
  ice: 'Gelo',
  fighting: 'Lutador',
  poison: 'Venenoso',
  ground: 'Terra',
  flying: 'Voador',
  psychic: 'Psíquico',
  bug: 'Inseto',
  rock: 'Pedra',
  ghost: 'Fantasma',
  dragon: 'Dragão',
  dark: 'Sombrio',
  steel: 'Aço',
  fairy: 'Fada'
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function capitalizeWords(str) {
  return str.split('-').map(word => capitalize(word)).join('-');
}

function showLoading() {
  isLoading = true;
  statusFill.style.width = '100%';
  pokemonDisplay.innerHTML = `
    <div class="loading-pokemon">
      <div class="loading-spinner"></div>
      <span>CARREGANDO...</span>
    </div>
  `;
}

function hideLoading() {
  isLoading = false;
  statusFill.style.width = '0%';
}

async function fetchPokemon(idOrName) {
  if (isLoading) return;
  
  showLoading();
  
  const isNumeric = !isNaN(idOrName) && !isNaN(parseInt(idOrName));
  if (isNumeric) {
    currentId = parseInt(idOrName);
  } else {
    currentId = typeof idOrName === 'number' ? idOrName : currentId;
  }

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName.toString().toLowerCase()}`);
    
    if (!response.ok) {
      throw new Error(`Pokémon não encontrado`);
    }

    const data = await response.json();
    currentPokemonData = data;
    
    if (typeof idOrName === 'string' && isNaN(idOrName)) {
      currentId = data.id;
    }

    renderPokemon(data);
    updateURL(data.id);

  } catch (error) {
    console.error('Erro ao buscar o Pokémon:', error);
    hideLoading();
    pokemonDisplay.innerHTML = `
      <div style="color: #ff4081; text-align: center; padding: 2rem;">
        <span style="font-size: 2rem;">⚠</span>
        <p style="margin-top: 0.5rem;">${error.message}</p>
      </div>
    `;
  }
}

function renderPokemon(data) {
  const primaryType = data.types[0].type.name;
  
  document.body.classList.remove('bg-type-normal', 'bg-type-fire', 'bg-type-water', 'bg-type-electric', 'bg-type-grass', 'bg-type-ice', 'bg-type-fighting', 'bg-type-poison', 'bg-type-ground', 'bg-type-flying', 'bg-type-psychic', 'bg-type-bug', 'bg-type-rock', 'bg-type-ghost', 'bg-type-dragon', 'bg-type-dark', 'bg-type-steel', 'bg-type-fairy');
  
  if (!document.body.classList.contains('light-mode')) {
    document.body.classList.add(`bg-type-${primaryType}`);
  }
  
  const img = document.createElement('img');
  img.src = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
  img.alt = capitalize(data.name);
  img.classList.add('pokemon-image');
  img.loading = 'lazy';

  pokemonDisplay.innerHTML = '';
  pokemonDisplay.appendChild(img);

  nameEl.textContent = capitalize(data.name);
  idEl.textContent = `#${String(data.id).padStart(3, '0')}`;

  typeEl.innerHTML = data.types.map(t => 
    `<span class="type-badge type-${t.type.name}">${typeTranslations[t.type.name] || capitalize(t.type.name)}</span>`
  ).join('');

  heightEl.textContent = `${(data.height / 10).toFixed(1)} m`;
  weightEl.textContent = `${(data.weight / 10).toFixed(1)} kg`;

  const abilities = data.abilities.map(a => {
    const abilityName = capitalizeWords(a.ability.name);
    return a.is_hidden ? `${abilityName} (Oculta)` : abilityName;
  }).join(', ');
  abilitiesEl.textContent = abilities;

  renderStats(data.stats);

  hideLoading();
}

function renderStats(stats) {
  baseStatsEl.innerHTML = '';
  
  const maxStat = 255;
  
  stats.forEach(stat => {
    const statDiv = document.createElement('div');
    statDiv.className = 'stat';
    
    const percentage = (stat.base_stat / maxStat) * 100;
    let fillClass = '';
    if (percentage < 40) fillClass = 'low';
    else if (percentage < 70) fillClass = 'medium';
    
    statDiv.innerHTML = `
      <label>${statTranslations[stat.stat.name] || capitalize(stat.stat.name)}</label>
      <div class="bar">
        <div class="fill ${fillClass}" style="width: ${percentage}%"></div>
      </div>
      <span class="stat-value">${stat.base_stat}</span>
    `;
    
    baseStatsEl.appendChild(statDiv);
  });
}

function updateURL(id) {
  const url = new URL(window.location);
  url.searchParams.set('id', id);
  window.history.replaceState({}, '', url);
}

function getPokemonFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || params.get('pokemon');
}

document.getElementById('next-btn').addEventListener('click', () => {
  currentId++;
  fetchPokemon(currentId);
});

document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentId > 1) {
    currentId--;
    fetchPokemon(currentId);
  }
});

toggleThemeBtn.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light-mode');
  const icon = toggleThemeBtn.querySelector('.theme-icon');
  icon.textContent = isLight ? '☀' : '◐';
  
  // Remove any type-based background classes
  document.body.classList.remove('bg-type-normal', 'bg-type-fire', 'bg-type-water', 'bg-type-electric', 'bg-type-grass', 'bg-type-ice', 'bg-type-fighting', 'bg-type-poison', 'bg-type-ground', 'bg-type-flying', 'bg-type-psychic', 'bg-type-bug', 'bg-type-rock', 'bg-type-ghost', 'bg-type-dragon', 'bg-type-dark', 'bg-type-steel', 'bg-type-fairy');
  
  // Apply type background only in dark mode
  if (currentPokemonData && !isLight) {
    document.body.classList.add(`bg-type-${currentPokemonData.types[0].type.name}`);
  }
});

menuToggle.addEventListener('click', () => {
  pokedexNav.classList.toggle('open');
  const isOpen = pokedexNav.classList.contains('open');
  menuToggle.setAttribute('aria-expanded', isOpen);
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrapper') && !e.target.closest('.suggestions-list')) {
    suggestionsList.classList.remove('show');
  }
});

async function fetchAllPokemonNames() {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
    const data = await response.json();
    allPokemonNames = data.results.map(p => ({
      name: p.name,
      url: p.url
    }));
  } catch (error) {
    console.error('Erro ao buscar nomes de Pokémon:', error);
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
      fetchPokemon(pokemon.name);
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
  const items = suggestionsList.querySelectorAll('li');
  
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
      if (query) {
        fetchPokemon(query);
        suggestionsList.classList.remove('show');
      }
    }
  } else if (e.key === 'Escape') {
    suggestionsList.classList.remove('show');
  }
});

const evolutionBtn = document.getElementById('evolution-btn');

if (evolutionBtn) {
  evolutionBtn.addEventListener('click', () => {
    if (currentPokemonData) {
      const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
      window.location.href = `${basePath}/evolucoes.html?pokemon=${currentPokemonData.name}`;
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  
  if (e.key === 'ArrowRight' || e.key === 'd') {
    currentId++;
    fetchPokemon(currentId);
  } else if (e.key === 'ArrowLeft' || e.key === 'a') {
    if (currentId > 1) {
      currentId--;
      fetchPokemon(currentId);
    }
  }
});

async function init() {
  await fetchAllPokemonNames();
  
  const urlId = getPokemonFromURL();
  if (urlId) {
    const id = parseInt(urlId);
    if (!isNaN(id) && id > 0 && id <= 1010) {
      currentId = id;
      fetchPokemon(currentId);
      return;
    }
    fetchPokemon(urlId);
    return;
  }
  
  fetchPokemon(currentId);
}

init();
