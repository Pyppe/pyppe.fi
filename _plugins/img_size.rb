module Jekyll
  module ImgSizeFilter
    def img_size(src, type = 'large')
      name = File.basename(src, ".*")
      ext  = File.extname(src)
      hash = @context.registers[:site].config['resource_hash']
      "#{name}.#{type}#{ext}?h=#{hash}"
    end
  end
end

Liquid::Template.register_filter(Jekyll::ImgSizeFilter)