module Jekyll

  class EnvironmentVariablesGenerator < Generator

    def generate(site)
      ## Add variables to site config
      site.config['resource_hash'] = Time.now.strftime('%Y-%m-%dT%H%M')
    end

  end

end