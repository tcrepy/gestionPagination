/**
 * le 01/06/18 par Tanguy Crepy
 * objet permettant la pagination et le tri par colonne d'un tableau, ainsi que la gestion de filtre
 * il faut des th sous la forme :
 * <th data-field="nom de la colonne dans la bdd">nom du champs</th>
 *
 * coté PHP on peut utiliser cette fonction pour gerer le orderBy :
 * protected static function orderByArray(&$sql, array $orderBy)
 * {
 *     $sql .= ' ORDER BY ';
 *     for ($i = 0; $i < count($orderBy); $i++) {
 *         $sql .= $_db->protect($orderBy[$i]['by']) . ' ' . $_db->protect($orderBy[$i]['order']) . (($i == (count($orderBy) - 1)) ? '' : ', ');
 *     }
 * }
 *
 * @param id_tableau string "#id" id qui contient le tableau
 * @param ajax lien de l'ajax ciblé par la fonction _pagine_contenu
 * @param nbElemParPage le nombre d'elements affichés par getPagineContenu
 * @param stylePagin le style de la pagination
 * @param defaultDatas objet sous la forme de "{key:value}"
 * @param id_pagine "#id" id qui contient la pagination
 * @param id_content_liste "#id" id du contenu du tableau
 * @param id_search id de la zone de saisie des filtres
 * @constructor
 */

function GestionPagination(id_tableau, ajax, nbElemParPage, stylePagin, defaultDatas, id_pagine, id_content_liste, id_search) {
    this.id_tableau = id_tableau;
    this.defaultDatas = defaultDatas || {};
    this.ajax = ajax;
    this.id_pagine = id_pagine || '#id_pagine';
    this.id_content_liste = id_content_liste || '#id_content_liste';
    this.order = [];
    this.nbElemParPage = nbElemParPage || 20;
    this.stylePagin = stylePagin || "";
    this.id_search = id_search || "#search_form";
    this.pageName = '';
    this.id_display_search = '#rechercher';
    this.id_search_button = '#filtre';
    this.class_filtre_input = '.filtre_input';
    this.sessionName = 'keepSearch_';

    this.defaultDatas = this.transformDatas(this.defaultDatas);
}

/**
 * la fonction a appeler pour pouvoir initialiser le tri des tableaux
 * Créer un watcher sur les click sur les différentes colonnes du tableau
 * tous les th ayant un data-field vont pouvoir être ordonnés et un icone signalant qu'il sont ordonnables sera visible
 */
GestionPagination.prototype.initSort = function (datasSup) {
    datasSup = datasSup || {};

    let GestionPagination = this;
    let col = $(this.id_tableau).find('th');
    col.each(function () {
        if (typeof $(this).data('field') !== 'undefined') {
            let text = $(this).text();
            $(this).html('<span class="gp-th-content">'+ text +'</span>');
            $(this).append('<i class="padding-left icon sort"></i>');
            $(this).find('.gp-th-content').on('click', function () {
                GestionPagination.changeOrder($(this));
                GestionPagination.getPagineContenu(datasSup);
            });

        }
    });
    this.getPagineContenu(datasSup);
};

/**
 * Affiche les datas renvoyées par l'ajax dans un tableau paginé
 */
GestionPagination.prototype.getPagineContenu = function (datasSup, functionCallBack) {
    datasSup = this.transformDatas(datasSup) || {};
    functionCallBack = functionCallBack || function (page, total) {};

    let datas = $.merge($.merge(datasSup, this.defaultDatas), _prepare_post(this.id_search, {
        'orderBy': JSON.stringify(this.order)
    }));
    _pagine_contenu(
        this.id_pagine,
        this.id_content_liste,
        this.ajax,
        datas,
        this.nbElemParPage,
        1,
        true,
        null,
        null,
        this.stylePagin,
        functionCallBack
    );
};

/**
 * permet de creer le tableau de tri {order: 'ASC | DESC', by: field}
 * @param elem
 */
GestionPagination.prototype.changeOrder = function (elem) {
    if (typeof elem.data('order') === 'undefined') {
        elem.data('order', 'ASC');
        elem.closest('th').find('i').attr('class', 'padding-left icon sort-desc');
        this.order.push({'order': 'ASC', 'by': elem.closest('th').data('field')});
    } else if (elem.data('order') === 'ASC') {
        elem.data('order', 'DESC');
        elem.closest('th').find('i').attr('class', 'padding-left icon sort-asc');
        this.removeFieldFromOrder(elem);
        this.order.push({'order': 'DESC', 'by': elem.closest('th').data('field')});
    } else {
        elem.removeData('order');
        elem.closest('th').find('i').attr('class', 'padding-left icon sort');
        this.removeFieldFromOrder(elem);
    }
};

/**
 * retire un element du tableau si il correspond au data('field') de @param elem
 * @param elem
 */
GestionPagination.prototype.removeFieldFromOrder = function (elem) {
    let i = 0;
    let GestionPagination = this;
    this.order.forEach(function (e) {
        if (e.by === elem.closest('th').data('field')) {
            GestionPagination.order.splice(i, 1);
        }
        i++;
    });
};

/**
 * Permet de transformer le tableau defaultDatas de la forme {key: value} à {name: key, value: value} pour pouvoir l'envoyer en post
 */
GestionPagination.prototype.transformDatas = function (datas) {
    let et = [];
    let j = 0;
    for (i in datas) {
        if ($.isArray(datas[i])) {
            for (k in datas[i]) {
                et[j] = {name: i + "[]", value:datas[i][k]};
                j = j + 1;
            }
        }
        else {
            et[j] = {name: i, value: datas[i]};
            j = j + 1;
        }
    }
    return et;
};

/**
 * Permet de déclarer les differents elements de la page relatif à la recherche et de récupérer la dernière recherche stockée en session
 *
 * @param pageName
 * @param id_display_search id du bouton permettant d'afficher les champs de recherche
 * @param id_search_button
 * @param class_filtre_input
 */
GestionPagination.prototype.initSearch = function (pageName, id_display_search, id_search_button, class_filtre_input) {
    this.pageName = pageName;
    this.id_display_search = id_display_search || this.id_display_search;
    this.id_search_button = id_search_button || this.id_search_button;
    this.class_filtre_input = class_filtre_input || this.class_filtre_input;
    this.watchersSearch();
    this.getPreviousSearch();
};

/**
 * Lance tous les observateurs d'événements necessaires à la recherche et à la conservation de celle d'une page à l'autre
 */
GestionPagination.prototype.watchersSearch = function () {
    let GestionPagination = this;
    $(GestionPagination.id_search_button).on('click', function () {
        let store = [];
        $(GestionPagination.id_search).find(GestionPagination.class_filtre_input).each(function () {
            if ($(this).attr('type') === 'checkbox') {
                if ($(this).is(':checked')) {
                    store.push({name: $(this).attr('name'), value: 'checked'})
                }
            } else {
                store.push({name: $(this).attr('name'), value: $(this).val()});
            }
        });
        sessionStorage.removeItem(GestionPagination.sessionName + GestionPagination.pageName);
        sessionStorage.setItem(GestionPagination.sessionName + GestionPagination.pageName, JSON.stringify(store));
    });
    $(this.id_display_search).on('click', function () {
        GestionPagination.displaySearch();
    });
    $(this.id_search_button).on('click', function () {
        GestionPagination.getPagineContenu();
    });
    $(GestionPagination.id_search).find(GestionPagination.class_filtre_input).each(function () {
        keyDownEnter('#' + $(this).attr('id'), GestionPagination.id_search_button);
    });
};

/**
 * récupère la dernière recherche connue
 */
GestionPagination.prototype.getPreviousSearch = function () {
    //TODO::gestion des types radio
    if (this.pageName === '') {
        return;
    }
    let datas = sessionStorage.getItem(this.sessionName + this.pageName);
    if (datas !== null) {
        datas = JSON.parse(datas);
        this.displaySearch();
        let GestionPagination = this;
        $(GestionPagination.id_search).find(GestionPagination.class_filtre_input).each(function () {
            let input = $(this);
            datas.forEach(function (e) {
                if (e.name === input.attr('name')) {
                    if (input.attr('type') === 'checkbox' && e.value === 'checked') {
                        input.prop('checked', true);
                    }
                    input.val(e.value);
                }
            })
        });
        GestionPagination.getPagineContenu();
    }
};

/**
 * permet d'afficher les champs de recherche
 */
GestionPagination.prototype.displaySearch = function () {
    //--- affichage des champs de recherche
    let GestionPagination = this;
    if ($(this.id_search).hasClass('none')) {
        $(GestionPagination.id_search).attr('class', '');
        $(GestionPagination.id_display_search).html('<i class="icon times"></i> Annuler la recherche');
    } else {
        $(GestionPagination.id_search).attr('class', 'none');
        $(GestionPagination.id_display_search).html('<i class="icon arrow-down"></i> Rechercher');
        $(GestionPagination.class_filtre_input).each(function () {
            if ($(this).attr('type') === 'checkbox') {
                $(this).attr('checked', false);
            } else {
                $(this).val('');
            }
        });
        sessionStorage.removeItem(GestionPagination.sessionName + GestionPagination.pageName);
        GestionPagination.getPagineContenu();
    }
};

function keyDownEnter(input, button) {
    $(input).keypress(function (e) {
        if (e.which === 13) {
            $(button).click();
        }
    });
}