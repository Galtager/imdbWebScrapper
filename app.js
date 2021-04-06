const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const cheerio = require('cheerio');
const app = express ();


var moviesList = [];



app.set('view engine','ejs');
app.use(bodyParser.urlencoded( { extended : true } ));


app.get('/',function(req,res){
    moviesList=[];
    return res.render('index',{title:"Seach for Movie",moviesList:moviesList});
})
 app.post('/',async function(request,response){
    moviesList=[];
    let url ='https://www.imdb.com/find?q='+request.body.search+'&s=tt&ttype=ft&ref_=fn_ft';
    var searchInput='';
    await toTitleCase(request.body.search)
    .then(srcs=>searchInput=srcs)
    .catch(err=>console.log(err));
    await startSearch(url,searchInput)
    .then(srcs=>{
        moviesList=srcs;
    })
    .catch(err=>console.log(err));
    return response.render('index',{title:"Seach for Movie",moviesList:moviesList});

});


app.listen(3000,function(){
    console.log('my server is running on port 3000');
});




function startSearch(searchUrl,searchInput){
    return new Promise((resolve,reject)=>{
        
        request(searchUrl,async(error,response,html) => {
        if(!error && response.statusCode==200)
        {
            const $=cheerio.load(html);
                
             let list = $('td[class="result_text"]')
            .find('a')
            .toArray()
            .filter(element => {
                if($(element.parent).text().includes("in development"))
                    return false;
                if($(element).text().includes(searchInput)||$(element).text().includes(searchInput.toLowerCase()))
                    return true;
        
            });
            const assyncList= await Promise.all(
                list.map(async element => {
                    var movieUrl ='https://www.imdb.com/'+$(element).attr('href');
                    var details='';
                    await singleMovie(movieUrl)
                    .then(srcs=>{
                        details=srcs;
    
                    })
                    .catch(err=>console.log(err));
                    return details;
                })
            );
                resolve(assyncList);
                return;
        }
        reject('error loading url');
    });
})}

 function singleMovie(movieUrl){
    return new Promise((resolve,reject)=>{
         request(movieUrl,(error,response,html) => {
                if(!error && response.statusCode==200){
                    const $=cheerio.load(html);
        
                    let title = $('.title_wrapper h1').contents().first().text().trim(); 
                    let genres=$('#titleStoryLine div.see-more').last().find('a').toArray().map(element=>$(element).text().trim()).toString();
                    let rating =$('.subtext').contents().first().text().trim();
                    let duration =$('div.subtext > time').text().trim();
                    let director =$('div.plot_summary > div:nth-child(2)').find('a').text();
                    let starsE=$('div.plot_summary > div:nth-child(4)').find('a').toArray().map(element=>$(element).text().trim());
                    let stars = starsE.slice(0,-1).toString();
                    
                    
                    var movieFinalDetails={movie : title+'|'};
                    if(genres) movieFinalDetails.movie+=genres+'|';
                    if(rating) movieFinalDetails.movie+=rating+'|';
                    if(duration) movieFinalDetails.movie+=duration+'|';
                    if(director) movieFinalDetails.movie+=director+'|';
                    if(stars) movieFinalDetails.movie+=stars;


                    resolve(movieFinalDetails);
                    return;
    
                }
                reject('error loading url')
                    });
    })
}

function toTitleCase(givenString){
    return new Promise((res,rej)=>{
        var str=givenString.split(" ");
        for(let i=0; i< str.length;i++){
            str[i]=str[i][0].toUpperCase()+str[i].substr(1);
        }
        var titleReturn=str.join(" ");
        res(titleReturn);
        return;
        
    })

}