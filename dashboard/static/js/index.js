const dropdownel = document.getElementById('dropdown');
const droddownhead = document.getElementById('dropdownHead');
const blur = document.querySelector('.blur');
const openSidenav = document.getElementsByClassName('open-sidenav')[0];
const sideNav = document.getElementsByClassName('sidenav')[0];
const menuOpen = document.getElementsByClassName('menu-icon')[0];

function dropdown(e) {
  if (dropdownel.style.visibility !== 'visible') {
    dropdownel.classList.toggle('dropdown-hidden');
    droddownhead.classList.toggle('dropdown-actived');
    blur.classList.toggle('visible');
  } else {
    dropdownel.classList.toggle('dropdown-hidden');
    blur.classList.toggle('visible');
  }
}

window.onresize = function () {
  if (!dropdownel) return console.info('Dropdown is not rendered');
  if (!droddownhead) return console.info('Dropdown head is not rendered');
  dropdownel.classList.remove('dropdown-hidden');
  droddownhead.classList.remove('dropdown-actived');
  blur.classList.remove('visible');
  sideNav.classList.remove('opened');
  if (menuOpen) menuOpen.classList.remove('disabled');
};

document.addEventListener('click', (e) => {
  if (!e.target.classList.contains('dropdownHead')) {
    const allDropdowns = document.querySelectorAll('.dropdown');
    [].forEach.call(allDropdowns, (curr) => {
      if (curr.style.visibility === 'visible') {
        curr.classList.toggle('dropdown-hidden');
      }
    });
  }
});

blur.addEventListener('click', () => {
  if (!dropdownel) return console.info('Dropdown is not rendered');
  if (!droddownhead) return console.info('Dropdown head is not rendered');
  dropdownel.classList.remove('dropdown-hidden');
  droddownhead.classList.remove('dropdown-actived');
  blur.classList.remove('visible');
});

const cross = document.querySelector('.menu-icon');
cross.addEventListener('click', () => {
  if (!dropdownel) return console.info('Dropdown is not rendered');
  if (!blur) return console.info('Blur is not rendered');
  dropdownel.classList.remove('dropdown-hidden');
  document.getElementById('dropdownHead').classList.remove('dropdown-actived');
  blur.classList.remove('visible');
});

if (openSidenav && sideNav) {
  openSidenav.addEventListener('click', () => {
    if (menuOpen) menuOpen.classList.toggle('disabled');
    sideNav.classList.toggle('opened');
    blur.classList.add('visible');
  });
}

blur.addEventListener('click', () => {
  if (sideNav && sideNav.classList.contains('opened')) {
    if (menuOpen) menuOpen.classList.toggle('disabled');
    sideNav.classList.toggle('opened');
    blur.classList.remove('visible');
  }
});

const c = document.querySelectorAll('input[type="switch"]');
for (let b = 0; b < c.length; b += 1) {
  const a = document.createElement('label');
  a.className = 'switch-uQvapcxk';
  c[b].parentNode.insertBefore(a, c[b]);
  a.appendChild(c[b]);
  a.dataset.value = c[b].checked;
  c[b].type = 'checkbox';
  c[b].oninput = function () {
    this.parentNode.dataset.value = this.checked;
  };
}
