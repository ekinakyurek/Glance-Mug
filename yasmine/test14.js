//<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
$(document).ready(function(){
$.ajax({
    url: "data.json",
    //force to handle it as text
    dataType: "text",
    success: function(data) {

        //data downloaded so we call parseJSON function 
        //and pass downloaded data
        var jsn = $.parseJSON(data);
        print(jsn)
        //now json variable contains data in json format
        //let's display a few items
        //for (var i=0;i<json.length;++i)
       // {
         //   $('#results').append('<div class="name">'+json[i].name+'</>');
        //}
    }
});
});
