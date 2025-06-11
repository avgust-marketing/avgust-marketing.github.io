// ------------------------------------------------
// Author: dimsemenov
// Author URI: https://github.com/dimsemenov
// File name: gallery-init.js
// https://codepen.io/dimsemenov/pen/ZYbPJM
// ------------------------------------------------

var initPhotoSwipeFromDOM = function(gallerySelector) {

    // parse slide data (url, title, size ...) from DOM elements
    // (children of gallerySelector)
    var parseThumbnailElements = function(el) {
        var thumbElements = el.childNodes,
            numNodes = thumbElements.length,
            items = [],
            figureEl,
            linkEl,
            size,
            item;

        for(var i = 0; i < numNodes; i++) {

            figureEl = thumbElements[i]; // <figure> element

            // include only element nodes
            if(figureEl.nodeType !== 1) {
                continue;
            }

            linkEl = figureEl.children[0]; // <a> element

            size = linkEl.getAttribute('data-size').split('x');

            // create slide object
            item = {
                src: linkEl.getAttribute('href'),
                w: parseInt(size[0], 10),
                h: parseInt(size[1], 10)
            };



            if(figureEl.children.length > 1) {
                // <figcaption> content
                item.title = figureEl.children[1].innerHTML;
            }

            if(linkEl.children.length > 0) {
                // <img> thumbnail element, retrieving thumbnail url
                item.msrc = linkEl.children[0].getAttribute('src');
            }

            item.el = figureEl; // save link to element for getThumbBoundsFn
            items.push(item);
        }

        return items;
    };

    // find nearest parent element
    var closest = function closest(el, fn) {
        return el && ( fn(el) ? el : closest(el.parentNode, fn) );
    };

    // triggers when user clicks on thumbnail
    var onThumbnailsClick = function(e) {
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : e.returnValue = false;

        var eTarget = e.target || e.srcElement;

        // find root element of slide
        var clickedListItem = closest(eTarget, function(el) {
            return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
        });

        if(!clickedListItem) {
            return;
        }

        // find index of clicked item by looping through all child nodes
        // alternatively, you may define index via data- attribute
        var clickedGallery = clickedListItem.parentNode,
            childNodes = clickedListItem.parentNode.childNodes,
            numChildNodes = childNodes.length,
            nodeIndex = 0,
            index;

        for (var i = 0; i < numChildNodes; i++) {
            if(childNodes[i].nodeType !== 1) {
                continue;
            }

            if(childNodes[i] === clickedListItem) {
                index = nodeIndex;
                break;
            }
            nodeIndex++;
        }



        if(index >= 0) {
            // open PhotoSwipe if valid index found
            openPhotoSwipe( index, clickedGallery );
        }
        return false;
    };

    // parse picture index and gallery index from URL (#&pid=1&gid=2)
    var photoswipeParseHash = function() {
        var hash = window.location.hash.substring(1),
        params = {};

        if(hash.length < 5) {
            return params;
        }

        var vars = hash.split('&');
        for (var i = 0; i < vars.length; i++) {
            if(!vars[i]) {
                continue;
            }
            var pair = vars[i].split('=');
            if(pair.length < 2) {
                continue;
            }
            params[pair[0]] = pair[1];
        }

        if(params.gid) {
            params.gid = parseInt(params.gid, 10);
        }

        return params;
    };

    var openPhotoSwipe = function(index, galleryElement, disableAnimation, fromURL) {
        var pswpElement = document.querySelectorAll('.pswp')[0],
            gallery,
            options,
            items;

        items = parseThumbnailElements(galleryElement);

        // define options (if needed)
        options = {

            showHideOpacity: true,

            // define gallery index (for URL)
            galleryUID: galleryElement.getAttribute('data-pswp-uid'),

            getThumbBoundsFn: function(index) {
                // See Options -> getThumbBoundsFn section of documentation for more info
                var thumbnail = items[index].el.getElementsByTagName('img')[0], // find thumbnail
                    pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                    rect = thumbnail.getBoundingClientRect();

                return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
            }

        };

        // PhotoSwipe opened from URL
        if(fromURL) {
            if(options.galleryPIDs) {
                // parse real index when custom PIDs are used
                // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
                for(var j = 0; j < items.length; j++) {
                    if(items[j].pid == index) {
                        options.index = j;
                        break;
                    }
                }
            } else {
                // in URL indexes start from 1
                options.index = parseInt(index, 10) - 1;
            }
        } else {
            options.index = parseInt(index, 10);
        }

        // exit if index not found
        if( isNaN(options.index) ) {
            return;
        }

        if(disableAnimation) {
            options.showAnimationDuration = 0;
        }

        // Pass data to PhotoSwipe and initialize it
        gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.init();
    };

    // loop through all gallery elements and bind events
    var galleryElements = document.querySelectorAll( gallerySelector );

    for(var i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i+1);
        galleryElements[i].onclick = onThumbnailsClick;
    }

    // Parse URL and open gallery if it contains #&pid=3&gid=1
    var hashData = photoswipeParseHash();
    if(hashData.pid && hashData.gid) {
        openPhotoSwipe( hashData.pid ,  galleryElements[ hashData.gid - 1 ], true, true );
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const pswpElement = document.querySelector('.pswp');
    if (!pswpElement) {
        console.warn('[DEBUG] Элемент .pswp не найден');
        return;
    }

    pswpElement.addEventListener('click', (e) => {
        const zoomWrap = e.target.closest('.pswp__zoom-wrap');
        if (zoomWrap) {
            console.log('[DEBUG] Клик внутри .pswp__zoom-wrap');
            e.preventDefault();
            e.stopPropagation();

            // Находим основное изображение
            const img = zoomWrap.querySelector('.pswp__img:not(.pswp__img--placeholder)');
            if (!img || !img.src) {
                console.warn('[DEBUG] Изображение или его src не найдены');
                return;
            }

            // Нормализуем src
            let imgSrc = img.src;
            // Удаляем file:// и путь к проекту
            const basePath = 'file:///home/oem/Documents/avgust-marketing/';
            if (imgSrc.startsWith(basePath)) {
                imgSrc = imgSrc.replace(basePath, '');
            }
            // Удаляем ведущий слэш, если есть
            imgSrc = imgSrc.replace(/^\//, '');

            console.log('[DEBUG] Нормализованный src:', imgSrc);

            // Находим <a> с совпадающим href
            const galleryLinks = document.querySelectorAll('.gallery__link');
            let targetLink = null;
            galleryLinks.forEach(link => {
                let linkHref = link.getAttribute('href');
                // Нормализуем href (удаляем ./ если есть)
                linkHref = linkHref.replace(/^\.\//, '');
                if (linkHref === imgSrc) {
                    targetLink = link;
                }
            });

            if (!targetLink) {
                console.warn('[DEBUG] Соответствующий gallery__link не найден для src:', imgSrc);
                return;
            }

            // Извлекаем data-ref-url
            const url = targetLink.getAttribute('data-ref-url');
            if (url) {
                console.log('[DEBUG] Открытие ссылки:', url);
                window.open(url, '_blank');
            } else {
                console.warn('[DEBUG] Атрибут data-ref-url не найден');
            }
        }
    });
});
// execute above function
initPhotoSwipeFromDOM('.my-gallery');