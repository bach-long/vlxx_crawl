const axios = require('axios');
const cheerio = require('cheerio');
const Nightmare = require("nightmare");
const XLSX = require('xlsx');

const nightmare = Nightmare({ show: false });

const extractData = (data) => {
    const $$$ = cheerio.load(data);
    const tags = ' '
    const title = $$$('#page-title > a').first().attr('title');
    const description = $$$('div.video-description').first().text();
    const link = $$$('video').first()[0].attribs.src;
    const actress = $$$('div.actress-tag > a').first().text();
    const id = Number($$$('#video').first().attr('data-id'));
    $$$('div.category-tag > a').each((_idx, el) => {
        tags += $$$(el).text() + ' ';
    })

    console.log({
        id: id,
        title: title,
        link: link,
        tags: tags,
        actress: actress,
        description: description,
    })

    return {
        id: id,
        title: title,
        link: link,
        tags: tags,
        actress: actress,
        description: description,
    }
}

async function getData () {
	try {
		const { data } = await axios.get(
		    'https://vlxx.sex/jav/'
		);
		const $ = cheerio.load(data);
		const links = []
        const fetchedData = []
        const finalPage = Number($('div.pagenavi').children().last().prev().attr('title').split(' ')[1])
        console.log(finalPage)
        for( i = 1; i <=finalPage; i++) {
            const {data} = await axios.get(
                `https://vlxx.sex/jav/${i}`
            );
            const $$ = cheerio.load(data)
		    $$('div.video-item > a').each(async (_idx, el) => {
		    	links.push(`https://vlxx.sex` + $$(el).attr('href'))
		    });
        }

        console.log(`achieved ${links.length} links`)
        
        console.log('crawling data ...')

        for(let i = 0; i < links.length; i++) {
            let response = await nightmare
                .goto(links[i])
                .wait("video")
                .evaluate(() => document.querySelector("body").innerHTML)
            let result = extractData(response)
            fetchedData.push(
                result
            )
        }
        console.log('done');
        return fetchedData;

	} catch (error) {
		throw error;
	}
};

const getResult = async () => {
    let result = await getData();
    let binaryWS = XLSX.utils.json_to_sheet(result);
    var jav = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(jav, binaryWS, 'vlxxJav_data')
    XLSX.writeFile(jav, 'VLXX_Crawl.xlsx')
    console.log('file exported');
}

getResult()