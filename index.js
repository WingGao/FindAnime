let _ = require('lodash');
let fs = require('fs');
let cheerio = require('cheerio');
let request = require('request');
request = request.defaults({jar: true});

const __DEBUG__ = true;


function animadb(name) {
    let cookieJson = JSON.parse(fs.readFileSync('cookie.json'));
    let cookieJar = request.jar();
    _.forEach(cookieJson, (v) => {
        let cookie = request.cookie(v.name + '=' + v.value);
        cookieJar.setCookie(cookie, 'http://anidb.net');
    });

    function get_option(url) {
        let option = {
            url: url,
            jar: cookieJar,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
                'Content-Type': 'application/json',
                "X-LControl": "x-no-cache",
            },
        };
        if (__DEBUG__) {
            option.proxy = 'http://127.0.0.1:8888';
        }
        return option
    }

    function single_info(id) {
        request(get_option('http://anidb.net/perl-bin/animedb.pl?show=anime&aid=' + id), (error, response, body) => {
            console.log(body)
        })
    }

    let option = get_option('http://anidb.net/perl-bin/animedb.pl?show=json&action=search&type=anime&query=' + encodeURIComponent(name));
    option.headers['Content-Type'] = 'application/json';

    request(option, (error, response, body) => {
        let bjson = JSON.parse(body);
        single_info(bjson[0].id);
        console.log(body)
    })
}

animadb("今からアタシ");