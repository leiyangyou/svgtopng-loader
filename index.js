const { DOMParser, XMLSerializer } = require('xmldom')
const { convert } = require('convert-svg-to-png');
const { getOptions, parseQuery } = require('loader-utils');
const xpath = require('xpath')

const parser = new DOMParser({
  defaultNSMap: {
    'image/svg+xml': 'http://www.w3.org/2000/svg'
  }
})

const serializer = new XMLSerializer();

module.exports = function (content) {
  this.cacheable && this.cacheable();
  
  const callback = this.async();
  
  const {
    queryPrefix = '--png-',
    ...loaderConvertOptions
  } = getOptions(this) || {}
  
  const query = this.resourceQuery ? parseQuery(this.resourceQuery) : {}
  
  const queryConvertOptions = {}
  
  for (let key of Object.keys(query)) {
    if (key.startsWith(queryPrefix)) {
      queryConvertOptions[key.substr(queryPrefix.length)] = query[key]
    }
  }
  
  const convertOptions = {
    ...loaderConvertOptions,
    ...queryConvertOptions
  }
  
  if (convertOptions.width || convertOptions.height) {
    const doc = parser.parseFromString(content, "image/svg+xml")
    const svg = doc.documentElement
    let viewBox = xpath.select1('string(./@viewBox)', svg)
    
    if (!viewBox) {
      const width = xpath.select1('string(./@width)', svg)
      const height = xpath.select1('string(./@height)', svg)
      viewBox = `0 0 ${width} ${height}`
      svg.setAttribute('viewBox', viewBox)
      content = serializer.serializeToString(doc)
    }
  }
  
  return convert(content, convertOptions).then(res => {
    callback(null, res)
  }).catch(callback)
};
