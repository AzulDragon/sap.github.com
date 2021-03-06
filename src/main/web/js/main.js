var jsonObjects = [],
    filteredObjects = [],
    deferreds = [],
    sortParam, filterParam, endpointUri;

// Set items never to display (like the web page repository)
var neverDisplay = ['sap.github.com'];


function getURLParameter(name) {
    return (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1];
}

function removeHTMLChars(str) {
    if (str && typeof str === 'string') {
        return str.replace(/(<([^>]+)>)/ig, "");
    } else {
        return null;
    }
}

function initDeafult() {
    // get sorting and filtering parameter from URI
    sortParam = getURLParameter('sort');
    filterParam = getURLParameter('filter');

    // if params not set, assign default values
    if (!sortParam) {
        // sorting is ascending by default
        sortParam = "newest";
    }

    if (!filterParam) {
        // filter for all projects by default
        filterParam = "all";
    }
}

function getHostAndPath(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
};

function getPath(href){
	return getHostAndPath(href).pathname;
}

function setURLParameter() {
    //set the URL accordingly
    if (getURLParameter('sort') !== sortParam || getURLParameter('filter') !== filterParam) {
    	history.pushState(null, null, getPath(window.location.href) + "?sort=" + sortParam + "&filter=" + filterParam);
    }
}

initDeafult();

function setSwitchState() {
    // get URL parameters and set for display
    if (sortParam === 'asc') {
        $("#sortAsc").addClass("active");
        $("#sortNewest").removeClass("active");
    } else if (sortParam === 'newest') {
        $("#sortNewest").addClass("active");
        $("#sortAsc").removeClass("active");
    }
}

//set the URL accordingly
history.replaceState(null, null, getPath(window.location.href) + "?sort=" + sortParam + "&filter=" + filterParam);

window.addEventListener('popstate', function () {
    initDeafult();
    setSwitchState();
    filterJSON(filterParam);
    displayObjects();
});

// format updatedAt for outpuf in project card (using locale string)
function formatDate(date) {
    if (date) {
        var formattedDate = new Date(date);
        return formattedDate.toLocaleDateString();
    } else {
        return null;
    }
}

// set the active category in the navbar
function setCategoryActive(cat) {
    $(".nav-category").each(function (i, obj) {
        if (cat.toLowerCase() === $(obj).text().toLowerCase()) {
            $(obj).parent().addClass('active');
        } else {
            $(obj).parent().removeClass('active');
        }
    });
}

// filter JSON by category
function filterJSON(cat) {
    $('#searchTxt').val('');

//    if (cat.toLowerCase() === "all") {
//        filteredObjects = jsonObjects;
//    } else {
        filteredObjects = [];

        $.each(jsonObjects, function (i, item) {
            // for each category
            var isPartOfCategory = false;

            $.each(item.categories, function (c, category) {
                if (cat.toLowerCase() === "all" || category.name.toLowerCase() === cat.toLowerCase()) {
                    isPartOfCategory = true;
                }
            });

            $.each(neverDisplay, function(n, never) {
                if (item.projectTitle.toLowerCase() === never.toLowerCase()) {
                    isPartOfCategory = false;
                }
            });

            if (isPartOfCategory) {
                filteredObjects.push(item);
            }
        });
//    }

    //set the URL accordingly
    setURLParameter();
    setCategoryActive(filterParam);
}

// search JSON for specific input
function searchJSON(input) {
    var searchStr = input === undefined ? '' : input.toLowerCase();

    filteredObjects = [];

    $.each(jsonObjects, function (i, item) {
        var project = item.projectTitle.toLowerCase(),
            description = item.projectDescription.toLowerCase();

        if ((project.indexOf(searchStr) >= 0) || (description.indexOf(searchStr) >= 0)) {
            filteredObjects.push(item);
        }
    });
}

// sort filtered projects by param
function sortJSON() {
    filteredObjects.sort(function (a, b) {
        var valueA, valueB;

        switch (sortParam) {
            // ascending by project name
            case 'asc':
                valueA = a.projectTitle.toLowerCase();
                valueB = b.projectTitle.toLowerCase();
                break;
                // newest by creation date (b and a is changed on purpose)
            case 'newest':
                valueA = new Date(b.updatedAt);
                valueB = new Date(a.updatedAt);
                break;
        }

        if (valueA < valueB) {
            return -1;
        } else if (valueA > valueB) {
            return 1;
        } else {
            return 0;
        }
    });

    //set the URL accordingly
    setURLParameter();
}

function displayObjects() {
    // TODO: search & onLoad & URL
    if (filteredObjects.length > 0) {
        sortJSON();
        $(".Container").empty();
        $.each(filteredObjects, function (i, item) {
            var str = '<div class="col-md-6"><div class="mix"><div class="row header">';

            if (item.projectTitle) {
                str += '<div class="col-md-8 col-xs-8"><span class="title"><a target="_blank" href="' + removeHTMLChars(item.linkToGithub) + '">' + removeHTMLChars(item.projectTitle.substring(0, 29));
                // if title is to long, indicate it
                if (item.projectTitle.length > 30) {
                    str += '...';
                }
                str += '</a></span></div>';
            }

            if (item.stargazers_count) {
                str += '<div class="col-md-2 col-xs-2 text-right"><span class="stars"><i class="fa fa-star"></i> ' + item.stargazers_count + '</span></div>';
            } else {
                // generate placeholder
                str += '<div class="col-md-2 col-xs-2 text-right"><span class="stars"></span></div>';
            }

            if (item.forks_count) {
                str += '<div class="col-md-2 col-xs-2 text-right"><span class="forks"><i class="fa fa-code-fork"></i> ' + item.forks_count + '</span></div>';
            } else {
                // generate placeholder
                str += '<div class="col-md-2 col-xs-2 text-right"><span class="forks"></span></div>';
            }

            // close header div
            str += '</div>';

            if (item.updatedAt) {
                str += '<div class="row details"><div class="col-md-6 col-sm-6 hidden-xs"><span class="updatedAt">Last updated on ' + formatDate(removeHTMLChars(item.updatedAt)) + '</span></div>';
            }

            if (item.subscribers_count) {
                str += '<div class="col-md-6 col-sm-6 hidden-xs text-right"><span class="watchers"><i class="fa fa-eye"></i> ' + item.subscribers_count + ' people watching</span></div>';
            }

            // close details div
            str += '</div>';

            if (item.projectDescription) {
                str += '<div class="row description"><div class="col-md-12"><p class="desc-text">' + removeHTMLChars(item.projectDescription.substring(0, 279));
                // if title is to long, indicate it
                if (item.projectDescription.length > 280) {
                    str += '...';
                }
                str += '</p></div></div>';
            }

            // add horizontal line and placeholder for language - even if not received by the API
            str += '<hr /><div class="row more-details"><div class="col-md-6 col-sm-6"><span class="language">Language: ' + removeHTMLChars(item.language) + '</span></div>';

            if (item.categories) {
                str += '<div class="col-md-6 col-sm-6 text-right"><span class="categories">Categories: ';
                // add all categories as labels
                $.each(item.categories, function (c, category) {
                    str += '<a class="filter">' + removeHTMLChars(category.name) + '</a>';
                    if (c < item.categories.length - 1) {
                        str += ', ';
                    }
                });
                str += '</span></div>';
            }

            // close more-details div
            str += '</div>';

            if (item.linkToGithub) {
                str += '<div class="row actions"><div class="col-md-6"><a target="_blank" class="btn btn-info btn-bottom-left" href="' + removeHTMLChars(item.linkToGithub) + '" role="button"><i class="fa fa-github"></i> Repository</a></div>';
            }

            if (item.linkToProject) {
                str += '<div class="col-md-6"><a target="_blank" class="btn btn-success btn-bottom-right" href="' + removeHTMLChars(item.linkToProject) + '" role="button"><i class="fa fa-external-link"></i> Get started</a></div>';
            }

            // close actions, max and col-md-6 div
            str += '</div></div></div>';

            $(".Container").append(str);
        });
    } else {
        // filtered objects is empty - show info
        $(".Container").empty().append('<div class="col-md-12" id="noResults">No results to display</div');
    }
}

function appendAPIData(data) {
    // find the json object that will be extended
    $.each(jsonObjects, function (i, item) {
        // ID is the link to GitHub
        if (item.linkToGithub === data.html_url) {
            // set updatedAt attribute for later usage like sort
            item.updatedAt = data.updated_at;

            // TODO: potentially attributes name and description could be used - less effort but would require people to maintain/update existing descriptions and names
            // attributes that could be used for enhancements: language, stargazers_count, forks_count, homepage
            if (data.language) {
                item.language = data.language;
            }
            if (data.homepage) {
                // will override the JSON url if maintained on GitHub on purpose
                item.linkToProject = data.homepage;
            }
            item.forks_count = data.forks_count;
            item.open_issues_count = data.open_issues_count;
            item.stargazers_count = data.stargazers_count;
            item.subscribers_count = data.subscribers_count;
        }
    });
}
//parses link in response header of github api call
function parse_link_header(header) {
    if (header.length == 0) {
        throw new Error("input must not be of zero length");
    }

    // Split parts by comma
    var parts = header.split(',');
    var links = {};
    // Parse each part into a named link
    parts.forEach(function (p) {
        var section = p.split(';');
        if (section.length != 2) {
            throw new Error("section could not be split on ';'");
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim();
        var name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
    });

    return links;
}

//fires a synchronous ajax Call to the github api
function getRepositoryData(callback, url) {
    var settings = {
        "async": false,
        "crossDomain": true,
        "url": url,
        "method": "GET",
//        "headers": {
//            "Authorization": "token " + githubToken
//        }
    }

    $.ajax(settings).done(function (responseBody, textStatus, xhr) {
        var links = parse_link_header(xhr.getResponseHeader("link"));
        var hasNext = links.next ? true : false;
        callback(responseBody, hasNext, links);
    });


}


$(document).ready(function () {

    // initialize tooltip
    //$( document ).tooltip();

    // integration of Google Analytics
    (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments);
        }, i[r].l = 1 * new Date();
        a = s.createElement(o),
            m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m);
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

    ga('create', 'UA-75506944-1', 'auto');
    ga('send', 'pageview');

    // word rotation in header
    $(function () {
        var words = ['Give', 'Take', 'Solve'],
            index = 0,
            $el = $('#rotate-word');
        setInterval(function () {
            (index + 1 < words.length - 1) ? index++ : index = 0;
            $el.fadeOut(function () {
                $el.text(words[index]).fadeIn();
            });
        }, 3000);
    });


    // sticky navbar on top
    $(window).scroll(function (e) {
        // let logo scroll with content
        var top = $(window).scrollTop();
        if (top >= 250 && ($(window).width() > 768)) {
            $(".navbar").css('transform', 'translateY(' + (top - 250) + 'px)');
        } else {
            $(".navbar").css('transform', 'translateY(0px)');
        }

        if ($("#nav").position().top - top < 453) {
            $(".stack-bottomright").css('bottom', 453 + 'px');
        }

        // back to top button
        if ($(this).scrollTop() > 250) {
            $('#back-to-top').fadeIn();
        } else {
            $('#back-to-top').fadeOut();
        }
    });

    // scroll body to 0px on click
    $('#back-to-top').click(function () {
        $('#back-to-top').tooltip('hide');
        $('body,html').animate({
            scrollTop: 0
        }, 800);
        return false;
    });

    //$('#back-to-top').tooltip('show');

    $('#sortAsc').click(function () {
        sortParam = 'asc';
        setSwitchState();
        sortJSON();
        displayObjects();
    });

    $('#sortNewest').click(function () {
        sortParam = 'newest';
        setSwitchState();
        sortJSON();
        displayObjects();
    });

    $(".filter").on("click", function (event) {
        $(".nav-category").parent().removeClass('active');

        filterJSON($(event.target).text());
        setCategoryActive($(event.target).text());
        displayObjects();
    });

    //loads projects from GitHub api to jsonObjects
    $(function () {
        var repos = [];
        var next = false;
        var link = "https://api.github.com/orgs/sap/repos?per_page=100";

        do {
            getRepositoryData(function (responseBody, hasNext, links) {
                repos = repos.concat(responseBody);
                console.log(repos);
                next = hasNext;
                link = links.next;
            }, link)
        } while (next)

        repos.forEach(function (repo) {
            var jsonObject = {};
            jsonObject.projectTitle = repo.name
            jsonObject.projectDescription = repo.description != null ? repo.description : ' ';
            jsonObject.linkToGithub = repo.html_url
            jsonObject.updatedAt = repo.updated_at
            jsonObject.language = repo.language
            jsonObject.linkToProject = repo.homepage
            jsonObject.forks_count = repo.forks_count
            jsonObject.open_issues_count = repo.open_issues_count
            jsonObject.stargazers_count = repo.stargazers_count
            jsonObject.subscribers_count = repo.subscribers_count
            
            // Add categories based on project name
            jsonObject.categories = [];
            if ( repo.name.startsWith("cloud-") || repo.name.startsWith("cf-") ){
            	var category = { 
            		name : "cloud"
            	}
            	jsonObject.categories.push( category );
            } else if ( repo.name.startsWith("hana-") || repo.name.startsWith("hxe-") ){
            	var category = { 
                		name : "data"
                	}
                jsonObject.categories.push( category );
            } else if ( repo.name.startsWith("openui5") || repo.name.startsWith("build") ){
            	var category = { 
                		name : "interface"
                	}
                jsonObject.categories.push( category );
            } else if ( repo.name.startsWith("Mobile") || repo.name.startsWith("sap_mobile") ){
            	var category = { 
                		name : "mobile"
                	}
                jsonObject.categories.push( category );
            } else {
            	var category = { 
                		name : "general"
                	}
                jsonObject.categories.push( category );
            }
            
            
            jsonObjects.push(jsonObject);
        });
        setSwitchState();
        filterJSON(filterParam);
        displayObjects();
    });

    // load project details via ajax
    /*$.getJSON("projects/projects.json", function (data) {
        jsonObjects = data;

        // use GitHub API to get updatedAt per project
        $.each(jsonObjects, function (key, value) {
            // use link to GitHub project in order to generate API endpoint uri
            value.APIUri = value.linkToGithub.replace("https://github.com", "https://api.github.com/repos");

            // collect all deffereds from calls to figure when all AJAX calls are complete
            deferreds.push(
                // get repo details from GitHub API
                $.ajax({
                    headers: {
                        "Accept": "application/vnd.github.v3+json",
                        // set authorization header to get 5000 requests/hr per IP for the GitHub API
                        "Authorization": "token " + githubToken
                    },
                    url: value.APIUri,
                    success: appendAPIData
                })
            );
        });

        $.when.apply($, deferreds).done(function () {
            // every ajax call has been completed
            console.log(jsonObjects);
            setSwitchState();
            filterJSON(filterParam);
            displayObjects();
        }).fail(function () {
            // even if GitHub API not reachable, show plain JSON data
            setSwitchState();
            filterJSON(filterParam);
            displayObjects();
        });
    });*/

    $('#searchTxt').on("keyup", function (event) {
        // if search is empty, reset to show all objects
        if (!$('#searchTxt').val()) {
            filteredObjects = jsonObjects;
            filterParam = 'all';
            setCategoryActive("all");
            //set the URL accordingly
            setURLParameter();
        } else {
            $(".nav-category").parent().removeClass('active');
            var search = $('#searchTxt').val();
            searchJSON(search);
        }
        displayObjects();
    });
});
