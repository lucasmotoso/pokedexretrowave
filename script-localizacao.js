document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const suggestionsList = document.getElementById('suggestions');
  const mapContent = document.getElementById('map-content');
  const locationsList = document.getElementById('locations-list');
  const themeToggle = document.getElementById('theme-toggle');
  const menuToggle = document.getElementById('menu-toggle');
  const pokedexNav = document.getElementById('pokedex-nav');

  let pokemonList = [];
  let searchTimeout = null;
  let loadedPokemon = null;

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function capitalizeWords(str) {
    return str.split('-').map(word => capitalize(word)).join('-');
  }

  function formatLocationName(name) {
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  async function fetchAllPokemonNames() {
    try {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
      const data = await response.json();
      pokemonList = data.results.map(p => ({
        name: p.name,
        url: p.url
      }));
    } catch (err) {
      console.error('Erro ao buscar lista de Pokémon:', err);
    }
  }

  function showSuggestions(query) {
    suggestionsList.innerHTML = '';
    
    if (query.length < 2) {
      suggestionsList.classList.remove('show');
      return;
    }

    const filtered = pokemonList
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
        fetchAndRenderLocation(pokemon.name);
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
        if (query) {
          fetchAndRenderLocation(query);
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

  async function fetchAndRenderLocation(pokemonName) {
    if (pokemonName.toLowerCase() === loadedPokemon) return;
    loadedPokemon = pokemonName.toLowerCase();

    mapContent.innerHTML = `
      <div class="map-background">
        <img src="imagens/mapa-mundi.png" alt="Mapa mundial Pokémon" class="world-map" />
      </div>
      <div class="map-overlay">
        <div class="location-loading">
          <div class="loading-spinner-loc"></div>
          <span>PESQUISANDO LOCAIS...</span>
        </div>
      </div>
    `;

    locationsList.innerHTML = '';

    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}/encounters`);
      
      if (!response.ok) {
        throw new Error('Pokémon não encontrado');
      }

      const locations = await response.json();

      mapContent.innerHTML = `
        <div class="map-background">
          <img src="imagens/mapa-mundi.png" alt="Mapa mundial Pokémon" class="world-map" />
        </div>
        <div class="map-overlay">
        </div>
      `;

      if (locations.length === 0) {
        mapContent.innerHTML += `
          <div class="map-overlay">
            <div class="location-error">
              <div class="error-icon">⚠</div>
              <p>Este Pokémon não foi encontrado em localizações conhecidas.</p>
            </div>
          </div>
        `;
        return;
      }

      for (const location of locations) {
        const card = document.createElement('div');
        card.className = 'location-card';
        
        const locName = formatLocationName(location.location_area.name);
        const versions = [...new Set(location.version_details.map(v => capitalize(v.version.name)))].join(', ');

        card.innerHTML = `
          <div class="location-header">
            <span class="location-name">${locName}</span>
            <span class="location-marker">🧭</span>
          </div>
          <div class="location-games">${versions}</div>
          <div class="other-pokemon">
            <span>Carregando outros Pokémon...</span>
          </div>
        `;

        card.addEventListener('click', () => {
          fetchOtherPokemonFromLocation(location.location_area.url, card.querySelector('.other-pokemon'));
        });

        locationsList.appendChild(card);
      }

    } catch (err) {
      console.error('Erro ao buscar localizações:', err);
      mapContent.innerHTML = `
        <div class="map-background">
          <img src="imagens/mapa-mundi.png" alt="Mapa mundial Pokémon" class="world-map" />
        </div>
        <div class="map-overlay">
          <div class="location-error">
            <div class="error-icon">⚠</div>
            <p>${err.message}</p>
          </div>
        </div>
      `;
    }
  }

  async function fetchOtherPokemonFromLocation(url, container) {
    container.innerHTML = '<span>Carregando...</span>';

    try {
      const res = await fetch(url);
      const data = await res.json();

      const pokemonNames = data.pokemon_encounters.map(p => p.pokemon.name);

      if (pokemonNames.length === 0) {
        container.innerHTML = '<span>Nenhum outro Pokémon nesta área.</span>';
        return;
      }

      container.innerHTML = '<strong>Outros Pokémon:</strong><div class="other-pokemon-list">' +
        pokemonNames.map(name => `<span class="pokemon-link" data-name="${name}">${capitalize(name)}</span>`).join('') +
        '</div>';
    } catch (err) {
      container.innerHTML = '<span>Erro ao carregar.</span>';
    }
  }

  locationsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('pokemon-link')) {
      const name = e.target.dataset.name;
      const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
      window.location.href = `${basePath}/index.html?pokemon=${name}`;
    }
  });

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

  async function init() {
    await fetchAllPokemonNames();

    const params = new URLSearchParams(window.location.search);
    const pokemonParam = params.get('pokemon');
    
    if (pokemonParam) {
      searchInput.value = capitalize(pokemonParam);
      fetchAndRenderLocation(pokemonParam);
    }
  }

  init();
});