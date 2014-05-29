module Jekyll
  module ContentPathFilter
    def content_path(input)
      input.gsub(/\/blog\//, "/content/")
    end
  end
end

Liquid::Template.register_filter(Jekyll::ContentPathFilter)