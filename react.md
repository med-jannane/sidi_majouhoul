Hada howa **L-KANZ L-LAKHER (Le Code Ultime)** mcharra7 bl-khchaybat w b les commentaires s-stra b-s-star. Jma3t lik fih axios, useEffect, useDispatch, useSelector, Router, Redux Toolkit, w **CRUD Kamel** (Ajout, Modif, Suppr, Recherche, Fetching).
Copier-Coller hadchi w 7afdo, fih ga3 l-asli7a li ghat7taj!
### 🚀 1. LES COMMANDES (L-Bdaya)
Ghaliban kaygolik "Donner les commandes pour préparer le projet". Kteb lih hadchi:
```bash
# 1. Créer l'application React
npx create-react-app mon-exam

# 2. Dkhoul l dossier
cd mon-exam

# 3. Installer ga3 l-matériel f deqqa wa7da (Redux, Router, Axios)
npm install @reduxjs/toolkit react-redux react-router-dom axios

# 4. Lancer l'application
npm start

```
### 🧠 2. REDUX: LE SLICE (L-Moteur dyal Data)
**Fichier: src/redux/crudSlice.js**
Hada howa l-qalb dyal l-application. Fih State w les Actions.
```javascript
import { createSlice } from '@reduxjs/toolkit';

const crudSlice = createSlice({
  // Smiya dyal l-partie f Redux
  name: 'appData', 
  
  // INITIAL STATE : Hna fin kankhbiw data dyalna
  initialState: {
    items: [],             // L-lista fin ghan7etto data li njibo b axios
    searchTerm: "",        // L-kelma li kanketbo f l-barre de recherche
    itemToEdit: null       // L-element li khtarina bach n-modifiweh
  },
  
  // REDUCERS : Homa les fonctions li kaybedlo l-State
  reducers: {
    // 1. RECEPTION DATA: Bach n3emmro tableau melli tjina data mn API (Axios)
    setItems: (state, action) => {
      state.items = action.payload; // action.payload hiya data li jat
    },
    
    // 2. AJOUTER: Nzidou objet jdid f tableau
    addItem: (state, action) => {
      state.items.push(action.payload);
    },
    
    // 3. SUPPRIMER: N-filtrerw l-items w n-7aydo li 3ndo nafs l-ID
    deleteItem: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    
    // 4. PREPARER MODIFICATION: N-savgardiw l-item li clikina 3lih "Editer"
    setEditItem: (state, action) => {
      state.itemToEdit = action.payload;
    },
    
    // 5. VALIDER MODIFICATION: N-beddlo l-qdim b jdid
    updateItem: (state, action) => {
      // Nqalbo 3la l'index dyal l-item f tableau
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload; // Nbedlolo data
        state.itemToEdit = null; // N-khwiw variable 7it salina modif
      }
    },
    
    // 6. RECHERCHE: N-savgardiw chno ktb user f l-input d recherche
    setSearch: (state, action) => {
      state.searchTerm = action.payload;
    }
  }
});

// N-exportiw les actions bach nkhdmo bihom f les components (b useDispatch)
export const { setItems, addItem, deleteItem, setEditItem, updateItem, setSearch } = crudSlice.actions;

// N-exportiw le reducer bach n-3tiwh l Store
export default crudSlice.reducer;

```
### 🏪 3. REDUX: LE STORE (L-Maghaza)
**Fichier: src/redux/store.js**
Hada howa li kayjma3 ga3 les slices.
```javascript
import { configureStore } from '@reduxjs/toolkit';
import crudReducer from './crudSlice'; // Importina reducer li sawbna l-foq

const store = configureStore({
  reducer: {
    // 'database' hiya smiya l-bab mn ghan-dkhlo l data f useSelector
    database: crudReducer 
  }
});

export default store;

```
### 📝 4. COMPOSANT FORMULAIRE (Ajout & Modif)
**Fichier: src/components/Form.js**
Kay3raf rasso wach ghayzid ola ghay-modifi b itemToEdit.
```javascript
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addItem, updateItem } from '../redux/crudSlice';

const Form = () => {
  // 1. STATE LOCAL dyal les inputs
  const [titre, setTitre] = useState("");
  
  // useDispatch: howa l-boustaji li kaysifat l-actions l-Store
  const dispatch = useDispatch();
  
  // useSelector: kanchoufo wach kayn chi item mkhabbi l-modification
  const itemToEdit = useSelector(state => state.database.itemToEdit);

  // useEffect: melli 'itemToEdit' ytbeddel, 3ammer l-input.
  useEffect(() => {
    if (itemToEdit) {
      setTitre(itemToEdit.titre); // 3ammer
    } else {
      setTitre(""); // Khwi
    }
  }, [itemToEdit]); // <--- Had l-fonction kadekhedem ghir ila tbeddel itemToEdit

  // L-Fonction li katkhdem melli n-clikiw 3la "Enregistrer"
  const handleSubmit = (e) => {
    e.preventDefault(); // Bach page ma t-rechargich
    
    if (itemToEdit) {
      // ILA KAN MODE MODIFICATION
      dispatch(updateItem({ id: itemToEdit.id, titre: titre }));
    } else {
      // ILA KAN MODE AJOUT
      dispatch(addItem({ id: Date.now(), titre: titre })); // Date.now() kandiroha bach n3tiw ID unique
    }
    
    setTitre(""); // Khwi input mn b3d ma nsaliw
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid black', padding: '10px' }}>
      <h2>{itemToEdit ? "Modifier" : "Ajouter"}</h2>
      <input 
        value={titre} 
        onChange={(e) => setTitre(e.target.value)} 
        placeholder="Entrez un titre..." 
      />
      <button type="submit">Sauvegarder</button>
    </form>
  );
}
export default Form;

```
### 📋 5. COMPOSANT LISTE (Fetch Axios + Recherche + Delete)
**Fichier: src/components/List.js**
```javascript
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios'; // N-importiw axios bach njibo data
import { setItems, deleteItem, setEditItem, setSearch } from '../redux/crudSlice';

const List = () => {
  const dispatch = useDispatch();
  
  // Njibo la liste w kelma d recherche mn Redux Store
  const { items, searchTerm } = useSelector(state => state.database);

  // useEffect: N-fetchiw data merra wa7da melli kat-t7el page
  useEffect(() => {
    if (items.length === 0) { // N-tjiboha gha ila kan tableau khawi
      axios.get('https://jsonplaceholder.typicode.com/albums') // Lien d'API
        .then(response => {
          // Nsifto data l-Redux bach y-savgardiha (kanakhdo gha 5 b slice)
          dispatch(setItems(response.data.slice(0, 5))); 
        })
        .catch(erreur => console.log("Erreur de connexion", erreur));
    }
  }, []); // <--- [] kat3ni: Dir hadchi MERRA WA7DA f l-bdaya (componentDidMount)

  // LOGIC DE RECHERCHE: N-filtrerw data qbel ma n-affichiwha
  // Ila kan searchTerm khawi, kat-rje3 liste kamla
  const listeFiltree = items.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.titre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2>Liste des éléments</h2>
      
      {/* L-Input dyal Recherche */}
      <input 
        type="text" 
        placeholder="Rechercher ici..." 
        value={searchTerm}
        // Kola tbya kat-dispatchi setSearch
        onChange={(e) => dispatch(setSearch(e.target.value))} 
      />

      {/* L-Affichage dyal Tableau */}
      <table border="1" width="100%" style={{ marginTop: '20px' }}>
        <thead>
          <tr><th>ID</th><th>Titre</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {listeFiltree.map(item => (
            <tr key={item.id}>  {/* L-Key darouriya f React */}
              <td>{item.id}</td>
              <td>{item.title || item.titre}</td>
              <td>
                {/* BOUTON MODIFIER: Kaysifat l-objet l-Store bach yban f Formulaire */}
                <button onClick={() => dispatch(setEditItem(item))}>
                  Modifier
                </button>
                
                {/* BOUTON SUPPRIMER: Kaysifat l-ID l-Store bach ytmsa7 */}
                <button onClick={() => dispatch(deleteItem(item.id))}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default List;

```
### 🌍 6. LE HEADER (Menu)
**Fichier: src/components/Header.js**
```javascript
import React from 'react';
import { Link } from 'react-router-dom'; // Link f blaset <a> bach page ma t-rechargich

const Header = () => {
  return (
    <nav style={{ padding: '10px', background: '#ddd', marginBottom: '20px' }}>
      {/* Liens vers les routes */}
      <Link to="/" style={{ marginRight: '15px' }}>Accueil</Link>
      <Link to="/crud">Gestion (CRUD)</Link>
    </nav>
  );
}
export default Header;

```
### 🧩 7. APP.JS (Tajmi3 + Routing)
**Fichier: src/App.js**
```javascript
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Form from './components/Form';
import List from './components/List';

function App() {
  return (
    // BrowserRouter howa li kay-activer système dyal routes
    <BrowserRouter>
      {/* Header kayban dima, fouq mn Routes */}
      <Header />
      
      <div style={{ padding: '20px' }}>
        <Routes>
          {/* Route dyal Accueil fih ghir la Liste */}
          <Route path="/" element={<List />} />
          
          {/* Route dyal Gestion fih Formulaire + Liste m3a b3dyathom */}
          <Route path="/crud" element={
            <div>
              <Form />
              <hr />
              <List />
            </div>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
export default App;

```
### 🔌 8. INDEX.JS (Branchement Redux)
**Fichier: src/index.js**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
// Provider howa li kaysile (connecte) React m3a Redux
import { Provider } from 'react-redux'; 
import store from './redux/store'; // Importi maghaza dyalk
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Ghat-dewer <App /> b <Provider> bach ga3 l-components yqdro ychoufo store
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);

```
### 🌟 KHULASA DYAL LES HOOKS (Bach ma tensach) :
 * **useSelector**: Kandiroh bach **N-QRAW** data mn Store (b7al ila katchouf f vitrina).
 * **useDispatch**: Kandiroh bach **N-BADLO** data f Store (howa l-boustaji li kaysifat l-Action l-Reducer).
 * **useEffect**: Kandiroh bach **N-LANCER** chi khdma ghir t-t7el l-page (b7al axios.get).
 * **useState**: Kandiroh ghir f **INPUTS** dyal l-formulaire (bla ma n-barzto Redux b kula 7arf kan-ktboh).