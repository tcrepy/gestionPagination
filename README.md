**Gestion Pagination**
======================

Créé par Tanguy Crepy le 01/06/2018

contact: 
- tanguy.crepy@sddea.fr
- contact@tanguycrepy.fr

Prototype qui permet de gérer les tableaux paginés, les filtres et leur conservations sur plusieurs pages sur ces tableaux, et le tri sur les colonnes des tableaux

**Initialisation**
------------------
En ayant un tableau paginé qui a cette forme

    <div class="row padding-top">
        <button id="rechercher" class="column_2 margin-top"><i class="icon arrow-down padding"></i> Rechercher</button>
    </div>
    <div class="row padding-top">
        <div id="search_form" class="none">
            <div class="row padding-top form">
                <div class="column_3 padding-bottom">
                    <label for="code" class="label">Code</label>
                    <input class="filtre_input" name="code" type="text" id="code"
                           placeholder="Filtrer les résultats d'après un code">
                </div>
                <div class="column_3 padding-bottom">
                    <label for="designation" class="label">Désignation</label>
                    <input class="filtre_input" name="designation" type="text" id="designation"
                           placeholder="Filtrer les résultats d'après une désignation">
                </div>
            </div>
            <button id="filtre" class="column_3">Filtrer</button>
        </div>
    </div>
    <div class="row padding-top">
        <div class="column_12" id="listeArticles">
            <table>
                <thead class="bck-theme color-white text bold">
                <tr>
                    <th data-field="ART_CODE">Code</th>
                    <th data-field="ART_DESIGNATION">Désignation</th>
                    <th>Action</th>
                </tr>
                </thead>
                <tbody id="id_content_liste"></tbody>
            </table>
        </div>
    </div>
    <div class="row padding-top text center">
        <div class="text center  column_10" id="id_contenu_dialog"></div>
        <div class="column_12">
            <div id="id_pagine" class="padding"></div>
        </div>
    </div>

L'objet doit être instancié au début du fichier dans lequel il est appelé

    let gp = new GestionPagination('#listeArticles', './ajax/ajx_gestionArticles', 20, '', {key: 'value', key2: 'value2'}, '#id_pagine', '#id_content_liste', '#search_form');


**Pagination**
--------------
La fonction `getPagineContenu()` permet de lancer la fonction `_pagine_contenu()` avec les données de `defaultDatas` et les données saisie dans les champs de recherche de `id_search`

Vous pouvez appeler cette fonction à chaque fois qu'il est nécessaire de recharger le contenu du tableau paginé

**Tri**
-------
On initialise le tri du tableau `id_tableau` avec : 

    $(document).ready(function(){
        gp.initSort();
    });

La fonction va aller chercher tous les `th` possédant un `data-field` afin de mettre en place un observateur sur le click.
Elle attribura automatiquement à chaque `th` un icon indiquant que le champs peut être ordonné.

La fonction appelle `getPagineContenu()` lors du clic sur un `th` et envoi à l'ajax `ajax` les données saisies dans le filtre, dans `defautlDatas`, et un objet JSON sous la forme :
    
    [
        {
            order: 'ASC|DESC',
            by: 'FIELD'
        }, 
        {
            order: 'ASC|DESC',
            by: 'FIELD2'
        }
    ] 

Les données contenues dans les `by` correspondent aux `data-field` des `th`

On peut ensuite facilement inclure les données du tableau à notre requete SQL qui permet d'afficher la pagination avec ce genre de fonction : 

    protected static function orderByArray($sql, array $orderBy)
    {
        global $_db;
        $sql .= ' ORDER BY ';
        for ($i = 0; $i < count($orderBy); $i++) {
            $sql .= $_db->protect($orderBy[$i]['by']) . ' ' . $_db->protect($orderBy[$i]['order']) . (($i == (count($orderBy) - 1)) ? '' : ', ');
        }
        return $sql;
    }

> Attention : ne pas oublier que le tableau envoyé en ajax est un objet JSON, il faut le faire passer dans un `json_decode($orderBy, true);`

**Recherche**
-------------
La recherche et sa conservation sur plusieurs pages s'initialise avec :

    $(document).ready(function(){
        gp.initSearch('pageName', '#rechercher', '#filtre', '.filtre_input');
    });

Seul le premier paramètre est obligatoire

Cette fonction va mettre en place des observateurs permettant :
 - d'afficher et de cacher les champs de recherche
 - de mettre en session les valeurs contenues dans les champs de recherche
 - de cliquer sur le bouton `id_search_button` lors de l'appui sur la touche entrée lorsque qu'un input est focus
 
Enfin si une session ayant le nom `sessionName + pageName` existe, la fonction se chargera automatiquement d'afficher les champs de recherche, de remplir les champs et de lancer `getPagineContenu()`

> La librairie fonctionne même si il n'y a pas de recherche, il suffit juste de ne pas mettre de `div#search_form` dans le html