(function () {

  const profileUrl = d => `https://twitter.com/intent/user?user_id=${d.id}`;
  const nodeImageUrl = d => `/img/twitter/profile_images/${d.screenName}.jpg`;

  /*
  window.prepareForScreenshot = () => {
    $('.canvas').css('background', 'black');
    $('.legend').hide();
    $('#twitter-user-graph button').hide();
    $('.user-select-container').hide();
    $(`
      <style>
        text {
          fill: white !important;
        }
      </style>
    `).appendTo($('body'));
  };
  */

  /*
  function hackDirectedAdjacencyMatrix(data) {
    "use strict";
    var screenNameById = id => _.find(data, {id}).screenName;
    const sep = '\t';
    var tsv = '';
    const users = _.sortBy(data, u => u.screenName.toLowerCase());
    const isLast = i => i === _.size(users) - 1;
    tsv += sep;
    _.forEach(users, (u, i) => {
      tsv += u.screenName;
      if (!isLast(i)) tsv += sep;
    });
    tsv += '\n';
    _.forEach(users, user => {
      const reactions = _.fromPairs(_.map(user.reactions, r => [screenNameById(r.id), r.count]));
      tsv += user.screenName;
      tsv += '\t';
      _.forEach(users, (other, i) => {
        if (other.id === user.id) {
          tsv += '-';
        } else {
          tsv += reactions[other.screenName] || 0;
        }
        if (!isLast(i)) tsv += sep;
      });
      tsv += '\n';
    });

    $("<textarea />").appendTo($('body')).val(tsv);
  }
  */

  let onNodeClick = _.noop;
  let nodes = [];

  function createTwitterUserGraph(asyncGraphData) {
    const Topics = {
      city: {
        label: 'Kaupunki',
        shortLabel: 'city',
        color: '#ff7f0e'
      },
      church: {
        label: 'Kirkko',
        shortLabel: 'kirkko',
        color: '#9467bd'
      },
      investing: {
        label: 'Pörssi / sijoittaminen',
        shortLabel: 'pörssi',
        color: '#333'
      },
      media: {
        label: 'Media / politiikka',
        shortLabel: 'media',
        color: '#d62728'
      },
      music: {
        label: 'Viihde / kulttuuri',
        shortLabel: 'viihde',
        color: '#2ca02c'
      },
      sports: {
        label: 'Urheilu',
        shortLabel: 'urheilu',
        color: '#888'
      },
      techsome: {
        label: 'Teknologia / sosiaalinen media',
        shortLabel: 'tech',
        color: '#1f77b4'
      }
    };
    const $container = $('#twitter-user-graph');
    const $canvas = $('<div class="canvas"></div>').appendTo($container);
    const $selectUser = $('<select class="user-select"></select>').appendTo($('<div class="user-select-container"/>').appendTo($container));
    const $legend = $(`
      <div class="legend">
        <h6>Aihealueet</h6>
        ${_.map(_.chain(Topics).map((t, key) => ({...t, key})).sortBy('shortLabel').value(), (t) => {
          return (`
            <span
              class="label topic has-tooltip"
              data-topic="${t.key}"
              tip-is-html
              tooltip-class="twitter-user-graph-tooltip"
              style="background-color: ${t.color}"
              title="<b>${t.label}</b><br/><small><em>(klikkaa nähdäksesi twiittaajat)</em></small>"
            >
              ${t.shortLabel}
            </span>
          `);
        }).join('\n')}
      </div>
    `).appendTo($container);
    _.forEach(_.sortBy(_.values(Topics), 'shortLabel'), t => {
      $(`
        <li><span class="label label-default" style="background-color: ${t.color}; width: 70px;">${t.shortLabel}</span> ${t.label}</li>
      `).appendTo($('#twitter-user-graph-topics'));
    });
    pyppe.util.bindTooltips($legend);

    const [isInitialFullscreen, initialUserScreenName] = (() => {
      const params = pyppe.util.parseQueryParams(location.search);
      return [_.has(params, 'fullscreen'), params.user];
    })();
    const $resizeButton = $(`
      <button class="btn btn-primary btn-sm resize-button">
        <span>${isInitialFullscreen ? 'Pienennä' : 'Suurenna'}</span>
        <i class="fa ${isInitialFullscreen ? 'fa-compress' : 'fa-expand'}"></i>
      </button>
    `).appendTo($container).click(toggleGraphSize);
    toggleBodyAndContainer(isInitialFullscreen);
    const $userInfo = $('<div/>').addClass('user-info').appendTo($container);
    let graphData = null;
    let openedUser = null;

    asyncGraphData.done(data => {
      //hackDirectedAdjacencyMatrix(data);
      const formatOption = (option, manyLines) => option.id ? $(`
        <div class="twitter-user-graph-user-option">
          <img src="${nodeImageUrl(option)}" alt="" />
          <div>
            <div>${_.escape(option.screenName)}</b>
            <div style="font-weight: 300; font-size: 11px">${manyLines ? _.escape(option.name) : ''}</div>
          </div>
        </div>
      `) : $(`<div class="twitter-user-graph-user-option">${option.text}</div>`);
      graphData = data;
      drawGraph(data, isInitialFullscreen, true);
      pyppe.util.onWindowWidthResized($container, () => {
        drawGraph(graphData, $container.is('.fullscreen'));
      });

      $selectUser.
        select2({
          placeholder: 'Etsi käyttäjää...',
          data: _.map(_.sortBy(data, d => d.screenName.toLowerCase()), user => ({
            ..._.pick(user, 'id', 'screenName', 'name'),
            text: `${user.screenName} ${user.name}`,
          })),
          templateResult: option => formatOption(option, true),
          templateSelection: option => formatOption(option, false)
        }).
        val(openedUser ? openedUser.id : null).trigger('change');

      $selectUser.on("select2:select", e => {
        const id = _.get(e, 'params.data.id', '').toString();
        if (id) {
          const node = _.find(nodes, d => d.id.toString() === id);
          if (node) {
            onNodeClick(node);
          }
        }
      });
    });

  function updateSearchUrlAndSelectedUser() {
    pyppe.util.replaceUrlSearch({
      fullscreen: $container.is('.fullscreen') ? true : null,
      user: openedUser ? openedUser.screenName : null
    });
    $selectUser.val(openedUser ? openedUser.id : null).trigger('change');
  }

  function toggleBodyAndContainer(expand) {
    if (expand) {
      $container.addClass('fullscreen');
      $('body').css('overflow', 'hidden');
    } else {
      $container.removeClass('fullscreen');
      $('body').css('overflow', 'inherit');
    }
  }
  function toggleGraphSize() {
    const $i = $resizeButton.find('.fa');

    const changeButton = expand => {
      $i.removeClass().addClass(expand ? 'fa fa-expand' : 'fa fa-compress');
      $resizeButton.find('span').text(
        expand ? 'Suurenna' : 'Pienennä'
      );
    };

    const expand = $i.hasClass('fa-expand');

    changeButton(!expand);
    toggleBodyAndContainer(expand);
    drawGraph(graphData, expand);
    updateSearchUrlAndSelectedUser();
  }

  // https://bl.ocks.org/mbostock/4062045
  // http://bl.ocks.org/eesur/be2abfb3155a38be4de4
  function drawGraph(inputData, fullscreen, isFirstLoad = false) {
    const data = _.cloneDeep(inputData);
    const [width, height] = (() => {
      const windowHeight = $(window).height();
      return [$canvas.width(), fullscreen ? windowHeight : Math.max(parseInt(windowHeight*0.7), 300)];
    })();
    //const linkDistance = parseInt(Math.max(100, Math.min(width,height) / 2));

    const popularityById = _.fromPairs(_.map(data, o => [o.id, o.reactionCountByOthers]));
    const maxPopularity = _.max(_.values(popularityById));
    const minPopularity = _.min(_.values(popularityById));

    const scaledPopularity = d3.scalePow().domain([minPopularity, maxPopularity]).range([10, 30]);
    //const scaledPopularity = d3.scalePow().domain([minPopularity, maxPopularity]).range([15, 20]);
    const dScaledPopularity = d => scaledPopularity(popularityById[d.id]);
    const dTopicColor = d => {
      if (_.has(Topics, d.topic)) {
        return Topics[d.topic].color;
      } else {
        console.log('Unknown topic: ' + d.topic);
        return 'black';
      }
    }

    nodes = _.map(data, obj => _.pick(obj, 'id', 'screenName', 'name', 'reactionCountByOthers', 'topic'));

    const links = (() => {
      const linkKey = (source, target) => [source, target].sort().join('|');
      const hashMap = _.reduce(data, (acc, obj) => {
        _.forEach(_.take(obj.reactions, 3), ({id, count}) => {
          const key = linkKey(obj.id, id);
          const accValue = acc[key] || {target: id, source: obj.id, count: 0};
          //const factor = (obj.id === '111684011' || id === '111684011') ? 10 : 1;
          accValue.count = (accValue.count + count) * 1;
          acc[key] = accValue;
        });
        return acc;
      }, {});
      return (
        _.chain(hashMap).
          values().
          //filter(({count}) => count > 2).
          sortBy(({count}) => -count).
          value()
      );
    })();

    const [scaleLinkWidth, scaleLinkDistance] = (() => {
      const counts = _.map(links, 'count');
      const minAndMax = [_.min(counts), _.max(counts)];

      const maxLinkDistance = Math.max(
        200,
        parseInt(Math.min(width, height) / 2)
      );
      return [
        d3.scalePow().domain(minAndMax).range([1, 8]),
        d3.scaleLinear().domain(minAndMax).range([maxLinkDistance, 50])
      ];
    })();

    const scaleNodeStrength = d3.scaleSqrt().domain([minPopularity, maxPopularity]).range([-20, 20]);

    d3.selectAll("#twitter-user-graph svg").remove(); // remove existing
    const svg = d3.select($canvas[0]).
      append("svg").
      attr("width", width).
      attr("height", height);

    // https://bl.ocks.org/emeeks/302096884d5fbc1817062492605b50dd
    // http://stackoverflow.com/questions/39379299/d3-v4-custom-linkstrength
    const simulation = d3.forceSimulation(nodes).
      force(
        "charge",
        d3.forceManyBody().
          strength(d => scaleNodeStrength(popularityById[d.id])).
          distanceMin(1).
          distanceMax(100)
      ).
      force("link",
        d3.forceLink(links).
          id(d => d.id).
          distance(d => scaleLinkDistance(d.count)).
          iterations(1)
      ).
      force("center", d3.forceCenter(width / 2, height / 2));

    onNodeClick = d => {
      $userInfo.html('');
      openedUser = null;
      onNodeMouseOut();
      onNodeMouseOver(d, links);
      openedUser = d;
      updateSearchUrlAndSelectedUser();
      const [matchingUsers, others] = _.partition(data, {id: d.id});
      const user = matchingUsers[0];
      const userOwnReactionCount = _.sumBy(user.reactions, 'count');
      $(`
        <button class="btn btn-default btn-sm close-details">
          Sulje <i class="fa fa-times"></i>
        </button>
        <a href="${profileUrl(d)}" target="_blank" class="profile"><img class="avatar" src="${nodeImageUrl(d)}" alt="" /></a>
        <div class="header">
          <h6>
            <a href="${profileUrl(d)}" target="_blank">@${_.escape(d.screenName)}</a>
            <div>${_.escape(d.name)}</div>
          </h6>
          <div class="text-muted">
            <i class="fa fa-mail-forward"></i> omat interaktiot <b>${userOwnReactionCount}</b> /
            <i class="fa fa-mail-reply"></i> muiden interaktiot <b>${user.reactionCountByOthers}</b>
          </div>
          <span class="label topic" style="background-color: ${dTopicColor(user)}">${Topics[user.topic].shortLabel}</span>
        </div>
      `).appendTo($userInfo);

      const rows = _.chain(others).
        map(other => {
          const otherCount = _.get(_.find(other.reactions, {id: d.id}), 'count', 0);
          const userCount = _.get(_.find(user.reactions, {id: other.id}), 'count', 0);
          const totalCount = otherCount + userCount;
          if (totalCount > 0) {
            return {
              ..._.pick(other, 'id', 'name', 'screenName'),
              userCount, otherCount, totalCount
            };
          } else {
            return null;
          }
        }).
        compact().
        sortBy(x => -x.totalCount).
        value();

      if (_.size(rows) > 0) {
        const $div = $('<div class="scrollable" />');
        const $table = $('<table class="table table-sm" />').appendTo($div);
        $(`
          <thead class="thead-default">
            <tr>
              <th data-asc="true">Kontakti</th>
              <th class="has-tooltip" title="Interaktiot @${_.escape(user.screenName)}&nbsp;→&nbsp;kontakti">
                <i class="fa fa-mail-forward"></i>
              </th>
              <th class="has-tooltip" title="Interaktiot kontakti&nbsp;→&nbsp;@${_.escape(user.screenName)}">
                <i class="fa fa-mail-reply"></i>
              </th>
              <th class="has-tooltip" title="Interaktiot yhteensä">Yht.</th>
            </tr>
          </thead>
        `).appendTo($table);
        const $tbody = $('<tbody />').appendTo($table);
        _.forEach(rows, row => {
          $(`
            <tr>
              <td data-value="${_.escape(row.screenName)}">
                <img src="${nodeImageUrl(row)}" />
                <a href="#" data-other-user-id="${row.id}">${_.escape(row.screenName)}</a>
              </td>
              <td data-value="${row.userCount}">${row.userCount}</td>
              <td data-value="${row.otherCount}">${row.otherCount}</td>
              <td data-value="${row.totalCount}">${row.totalCount}</td>
            </tr>
          `).appendTo($tbody);
        });
        $div.appendTo($userInfo);
        pyppe.util.bindTooltips($table);
        pyppe.util.bindTableSorting({$table, initialSortIndex: 3});
      }

      $userInfo.find('.close-details').click(closeUserInfo);

      $userInfo.find('[data-other-user-id]').click(function(e) {
        e.preventDefault();
        const id = $(this).data('otherUserId').toString();
        const node = _.find(nodes, d => d.id.toString() === id);
        openedUser = null;
        onNodeMouseOut();
        onNodeClick(node);
      });

      $userInfo.slideDown();
    };

    const link =
      svg.append("g").
        attr("class", "links").
        selectAll("path").
        data(links).
        enter().append("path").
        attr("stroke-width", d => scaleLinkWidth(d.count)).
        attr("class", 'link');

    const node =
      svg.append("g").
        attr("class", "nodes").
        selectAll("g.node").
        data(nodes).
        enter().
        append("g").
        attr("class", "node");
        window.node = node;

    const clipPath = node.append("clipPath").
      attr('id', d => "clip-"+d.id).
      append('ellipse').
      attr("cx", 0).
      attr("cy", 0).
      attr("rx", dScaledPopularity).
      attr("ry", dScaledPopularity);

    const circle = node.
      append("circle").
      attr("r", dScaledPopularity).
      attr("fill", 'white').
      style("stroke", dTopicColor);

    const image = node.
      append("image").
      attr("xlink:href", nodeImageUrl).
      attr("x", d => -dScaledPopularity(d)).
      attr("y", d => -dScaledPopularity(d)).
      attr("height", d => dScaledPopularity(d) * 2).
      attr("width", d => dScaledPopularity(d) * 2).
      attr("clip-path", d => `url(#clip-${d.id})`);

    const text = node.
      append("text").
      attr("y", d => dScaledPopularity(d) + 13).
      attr("x", d => -3 * _.size(d.screenName)).
      text(d =>  d.screenName);

    node.
      on("mouseover", d => onNodeMouseOver(d, links)).
      on("mouseout", onNodeMouseOut).
      on('click', onNodeClick).
      call(
        d3.drag().
          on("start", dragstarted).
          on("drag", dragged).
          on("end", dragended)
      );

    simulation.on("tick", ticked);

    closeUserInfo();
    if ($container.css('visibility') === 'hidden') {
      setTimeout(() => {
        $container.css('visibility', 'visible').hide().fadeIn();
      }, 200);
    }

    function onNodeMouseOut() {
      if (!openedUser) {
        link.transition().style('opacity', 1.0);
        text.transition().style('display', 'none');
        node.transition().
          style('pointer-events', 'all').
          style('opacity', 1.0);
      }
    }

    $legend.off('click', '.topic');
    $legend.on('click', '.topic', function () {
      closeUserInfo();
      onTopicClick($(this).data('topic'));
    });

    if (isFirstLoad && initialUserScreenName) {
      const screenName = initialUserScreenName.toLowerCase();
      const node = _.find(nodes, d => d.screenName.toLowerCase() === screenName);
      if (node) {
        onNodeClick(node);
      }
    }


    function ticked() {
      link.attr("d", d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx*dx + dy*dy)*4.0;
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x}, ${d.target.y}`;
      });

      //node.attr("transform", d => `translate(${d.x},${d.y})`);
      node.attr("transform", d => {
        const r = dScaledPopularity(d);
        d.x = Math.max(r, Math.min(width - r, d.x));
        d.y =  Math.max(r, Math.min(height - r, d.y));
        return `translate(${d.x},${d.y})`;
      });
    }

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function closeUserInfo() {
      $userInfo.slideUp();
      openedUser = null;
      onNodeMouseOut();
      updateSearchUrlAndSelectedUser();
    }

    function onTopicClick(topic) {
      const topicNodeIds = _.chain(nodes).filter({topic}).map(d => [d.id, true]).fromPairs().value();
      const isRelevantNode = d => !!topicNodeIds[d.id];
      const lowOpacity = 0.05;

      transformGraph({
        isActiveNode: _.constant(false),
        isRelevantNode,
        isDirectLink: other => isRelevantNode(other.source) && isRelevantNode(other.target),
        isIndirectLink: _.constant(false)
      });
    }

    function transformGraph({isActiveNode, isRelevantNode, isDirectLink, isIndirectLink}) {
      const lowOpacity = 0.05;

      node.transition().
        style('opacity', d => isRelevantNode(d) ? 1.0 : lowOpacity).
        style('pointer-events', d => isRelevantNode(d) ? 'all' : 'none');

      text.transition().
        style('display', d => isRelevantNode(d) ? 'inherit' : 'none').
        style('stroke', d => isActiveNode(d) ? '#027891' : 'none').
        style('font-size', d => isActiveNode(d) ? '14px' : '12px').
        style('stroke-width', d => isActiveNode(d) ? '1px' : '0px').
        style('stroke-opacity', d => isActiveNode(d) ? 0.6 : 0);

      link.transition().style('opacity', other => {
        if (isDirectLink(other)) {
          return 1.0;
        } else if (isIndirectLink(other)) {
          return 0.5;
        } else {
          return lowOpacity;
        }
      });
    }

    function onNodeMouseOver(d, links) {
      if (openedUser) { return; }
      const {id} = d;
      const adjacentIds = _.reduce(links, function(acc, other) {
        if (d.id === other.source.id || d.id === other.target.id) {
          acc[other.source.id] = true;
          acc[other.target.id] = true;
        }
        return acc;
      }, {});
      const lowOpacity = 0.05;

      transformGraph({
        isActiveNode: d => d.id === id,
        isRelevantNode: d => d.id === id || adjacentIds[d.id],
        isDirectLink: other => d.id === other.source.id || d.id === other.target.id,
        isIndirectLink: other => adjacentIds[other.source.id] && adjacentIds[other.target.id]
      });
    }
  }
  }

  pyppe.twitterUserGraph = {
    createTwitterUserGraph
  };

})();