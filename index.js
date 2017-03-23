let _ = require('lodash');
let fs = require('fs');
let cheerio = require('cheerio');
let request = require('request');
request = request.defaults({jar: true});

const __DEBUG__ = true;

const STATE_UNCEN = 0;
const STATE_CEN = 1;
const STATE_UNKNOWN = 2;

function cenStr(cen) {
    return ['UNCEN', 'CEN', 'UNKNOWN'][cen]
}

function animadb() {
    let cookieJson = JSON.parse(fs.readFileSync('cookie.json'));
    let cookieJar = request.jar();
    _.forEach(cookieJson, (v) => {
        let cookie = request.cookie(v.name + '=' + v.value);
        cookieJar.setCookie(cookie, 'http://anidb.net');
    });
    //制造请求
    function get_option(url, opt = {}) {
        opt = _.defaults(opt, {
            json: false,
        });
        let option = {
            url: url,
            jar: cookieJar,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
                "X-LControl": "x-no-cache",
            },
        };
        if (opt.json) {
            option.headers['Content-Type'] = 'application/json';
        }
        if (__DEBUG__) {
            option.proxy = 'http://127.0.0.1:8020';
        }
        return option
    }

    //获取单页信息
    function single_info(id) {
        request(get_option('http://anidb.net/perl-bin/animedb.pl?show=anime&aid=' + id), (error, response, body) => {
            let $ = cheerio.load(body);
            let mydata = $('#mydata');
            let seen = mydata.find('.mylistseen .value').text();
            let score = mydata.find('.myvote').text();
            console.log(seen, score)
        })
    }

    //获取的ed2k
    function get_ed2k(aid, eid, sort = true) {
        request(get_option(`http://anidb.net/perl-bin/animedb.pl?show=json&action=expand_episode&unhide=1&aid=${aid}&eid=${eid}`, {
            json: true,
        }), (error, response, body) => {
            let data = JSON.parse(body)[0];
            console.log('ed2k', data.id, data.cnt)
            let $ = cheerio.load(data.html);
            //遍历所以tr
            let links = [];
            $('.filelist tbody tr').each((i, elem) => {
                let ele = $(elem);
                let resolution = ele.find('.resolution').text().trim();
                let censtate = STATE_UNKNOWN;
                if (ele.find('.i_uncensored').length > 0) {
                    censtate = STATE_UNCEN;
                } else if (ele.find('.i_censored').length > 0) {
                    censtate = STATE_CEN;
                }
                let link = ele.find('.i_file_ed2k').attr('href');
                if (link === undefined) {
                    return;
                }
                let linkObj = {
                    link: link,
                    resolution: resolution,
                    censtate: censtate,
                };
                links.push(linkObj);
            });
            if (sort) {
                links = _.orderBy(links, (l) => {
                    let score = 0;
                    if (l.censtate == STATE_UNCEN) {
                        score = 30000;
                    } else {
                        score = 20000;
                    }
                    if (l.resolution.indexOf('x') > 0) {
                        score += parseInt(l.resolution.split('x')[0])
                    }
                    return -score
                });
            }
            console.log(links)
        })
    }

    //搜索相关信息
    function search(name) {
        let option = get_option('http://anidb.net/perl-bin/animedb.pl?show=json&action=search&type=anime&query=' + encodeURIComponent(name), {json: true});

        request(option, (error, response, body) => {
            let bjson = JSON.parse(body);
            //single_info(bjson[0].id);
            console.log(body)
        })
    }

    return {
        search: search,
        single_info: single_info,
        get_ed2k: get_ed2k,
    }
}

let ani = animadb();
//ani.search("学園美少女制裁秘録");
//ani.single_info(12424);
//ani.get_ed2k(12005, 180186);
ani.get_ed2k(528, 5850);