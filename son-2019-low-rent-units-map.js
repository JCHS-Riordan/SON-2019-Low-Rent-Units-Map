var H = Highcharts
var cbsas = Highcharts.geojson(Highcharts.maps['countries/us/cbsa'])
var states = Highcharts.geojson(Highcharts.maps['countries/us/states'])

var sheetID = '12qk05RW5qBvoDqg-BCXdvl1dor6DpE-jHqlORq1RO74'
var range = 'Sheet1!A:I'

var chart_title = 'The Low-Rent Stock in Most Metros Has <br/> Declined Substantially Since 2011'
var legend_title = 'Change in Units with<br/> Rents Under $800,<br/>2011–2017 (Percent)'

var table_notes = 'Notes: Low-rent units have contract rents below $800. Rents are adjusted to 2017 dollars using CPI-U Less Shelter. Incomes are adjusted to 2017 dollars using CPI-U All Items. Low-income renters have household incomes below $32,000. <br/> Source: <a href="https://www.jchs.harvard.edu/" target="_blank">Harvard Joint Center for Housing Studies</a> tabulations of US Census Bureau, American Community Survey 1-Year Estimates using the Missouri Data Center data.'
//Hyperlink doesn't work in the exported image and the full JCHS name makes the source two lines long, so reverting to 'JCHS' in the source here for the export
var export_notes = 'Notes: Low-rent units have contract rents below $800. Rents are adjusted to 2017 dollars using CPI-U Less Shelter. Incomes are adjusted to 2017 dollars using CPI-U All Items. Low-income renters have household incomes below $32,000. <br/> Source: JCHS tabulations of US Census Bureau, American Community Survey 1-Year Estimates using the Missouri Data Center data.'

var export_filename = "Metro Low-Rent Unit Loss - Harvard JCHS - State of the Nation's Housing 2019"

var default_selection = 2

var categories = [],
    ref_data = [],
    selected_data = [],
    chart_options = {},
    chart = {},
    drilldown_chart = {}

/*~~~~~~~ Document ready function ~~~~~~~*/
$(document).ready(function() {
  //get Google sheet data
  $.get(H.JCHS.requestURL(sheetID, range), function(obj) {
    categories = obj.values[0]
    ref_data = obj.values.slice(1)

    //create the title, notes, and search box
    //$('#chart_title').html(chart_title) //Disabling for use on website, where the title is in the page, making this title redundant
    $('#table_notes').html(table_notes)

    H.JCHS.createSearchBox(ref_data, searchCallback, '', 1, 'search', 'Need help finding a metro? Search here...') //5th argument (the 1) tells the search box to list column index 1 from ref_data, instead of the default 0 (in this case metro name, not GEOID)

    //create the chart
    createChart()

  })
}) //end document.ready


function createChart() {

  selected_data = ref_data.map(function (x) {
    return [x[0], x[default_selection]] //return data in 2 columns, GEOID and the value to be mapped

  })

  /*~~~~~~~ Chart Options ~~~~~~~*/
  chart_options = {
    JCHS: {
      drilldownFunction: drilldownChart
    },
    chart: {
      events: {
        load: function() {
          initUserInteraction()
        },
      },
    },

        legend: {
        title: {
          text: legend_title
        },
      labelFormatter: function () {
        if ((this.from == -50) & (this.to == -25)) { //legend entries w/ upper & lower bound
          return '25–49% Decline'
        } else if ((this.from == -25) & (this.to == -5)) {
          return '5–24% Decline'
        } else if ((this.from == -5) & (this.to == 5)) {
          return 'Unchanged'
        } else if (this.to != null) { //lowest legend entry
          return '50–67% Decline'
        } else if (this.from != null) { //highest legend entry
          return '5–85% Increase'
        }
    },
    x:10,
    y:1
  },

    colorAxis: {
      dataClasses: [
        { to: -50 },
        { from: -50, to: -25 },
        { from: -25, to: -5 },
        { from: -5, to: 5 },
        { from: 5 }
      ]
    },
    series: [
      {
        type: 'map',
        name: categories[default_selection],
        mapData: cbsas,
        data: selected_data
      }, {
        type: 'mapline',
        name: 'State borders',
        data: states
      }
    ], //end series


    // Exporting options
    exporting: {
      filename: export_filename,
      JCHS: { sheetID: sheetID },
      chartOptions: {
        chart: {
          marginBottom: 50 //may have to adjust to fit all of the notes
        },
        title: { text: chart_title },
        subtitle: {text: export_notes,
                  y: -18},
        legend: {
          title: {
            text: 'Change in Low-Rent<br/>Units, 2011-2017 (%)' //Abbreviated legend title for formatting
          },
          y: -28, //may have to adjust to fit all of the notes
          x: 3
        }
      },
      buttons: {
        contextButton: {
          menuItems: ['viewFullDataset', 'separator', 'downloadPDF', 'separator', 'downloadPNG', 'downloadJPEG']
        } //end contextButtons
      } //end buttons
    }, //end exporting

    tooltip: {
      formatter: function() {
        var point = this.point
        var series = this.series
        var user_selection = $('#user_input :checked').val()

        var tooltip_text = ''
        tooltip_text +=  '<b>' +  point.name + '</b>'
        tooltip_text +=  '<br><br>Change in Units with Rents Under $800: <b>' + H.JCHS.numFormat(point.value, 1) + '%</b>'
        //tooltip_text +=  '<br><br>Change in Units with Rents Under $800: <b>' + Math.round(point.value) + '%</b>'

        ref_data.forEach(function (el) {
          if (el[0] == point.GEOID) {
        tooltip_text +=  '<br>Share of Rentals Under $800 (in 2017): <b>' + H.JCHS.numFormat(el[3], 1).toLocaleString()  + '%</b>'
        tooltip_text +=  '<br>Number of Low-Rent Units in 2011: <b>' + Math.round(el[4]).toLocaleString()  + '</b>'
        tooltip_text +=  '<br>Number of Low-Rent Units in 2017: <b>' + Math.round(el[5]).toLocaleString()  + '</b>'
        tooltip_text += '<br><br>Change in Low-Income Renters: <b>' + H.JCHS.numFormat(el[6], 1).toLocaleString() + '<b>' + '%</b>'
        tooltip_text +=  '<br></b>Number of Low-Income Renters in 2011: <b>' + Math.round(el[7]).toLocaleString()  + '</b>'
        tooltip_text +=  '<br>Number of Low-Income Renters in 2017: <b>' + Math.round(el[8]).toLocaleString()  + '</b>'
          }
        })


        return tooltip_text

      }
    }
  } //end chart_options

  /*~~~~~~~ Create Chart ~~~~~~~*/
  chart = Highcharts.mapChart(
    'container',
    chart_options
  ) //end chart

} //end createChart()

/*~~~~~~~~~~~~~~ User interaction ~~~~~~~~~~~~~~~~~~~*/
function initUserInteraction () {
  $('#user_input').on('change', function () {
    var new_col = parseInt($('#user_input :checked').val())
    var new_data = ref_data.map(function (x) {
      return [x[0], x[new_col]]
    })
    chart.series[0].update({name: categories[new_col]})
    chart.series[0].setData(new_data)
  })
}

function searchCallback (metro_name) {
  H.JCHS.mapLocatorCircle(chart, metro_name)
}

function drilldownChart(metro_name) {
  $('.JCHS-chart__modal').css('display','block')
  console.log(metro_name)

  var chart_data = []

  ref_data.forEach(function (el) {
    if (el[1] == metro_name) {
      switch ($('#user_input :checked').val()) {
        case '2':
          chart_data = el.slice(17,28)
          break
        case '3':
          chart_data = el.slice(28,39)
          break
        case '4':
          chart_data = el.slice(39,50)
          break
      } //end switch
    } //end if
  }) //end forEach

  var drilldown_options = {
    JCHS: {
      yAxis_title: 'Percent'
    },

    subtitle: {
      text:
      'Share of Cost-Burdened Households Age ' +
      $('#user_input :checked').parent('label').text().trim() + //text displayed next to radio button
      ' in ' + metro_name
    },


    yAxis: [{
      labels: {
        enabled: true,
        format: "{value}%"
      }
    }],

    xAxis: {
      categories: categories.slice(17, 28)
    },

    tooltip: {
      pointFormat: "<b>{point.y}</b>",
      valueDecimals: 0,
      valueSuffix: '%'
    },

    series: [
      {
        name: metro_name,
        data: chart_data,
        zones: [
          {
            value: 20,
            className: 'zone-0'
          },
          {
            value: 30,
            className: 'zone-1'
          },
          {
            value: 40,
            className: 'zone-2'
          },
          {
            className: 'zone-3'
          }
        ],
    }],

  }

  drilldown_chart = Highcharts.chart(
    'drilldown_chart',
    H.merge(H.JCHS.drilldownOptions, drilldown_options)
  )

} //end drilldownChart()
