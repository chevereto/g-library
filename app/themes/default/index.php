<?php if(!defined('access') or !access) die("This file cannot be directly accessed."); ?>
<?php G\render\include_theme_file('header'); ?>

<div id="home-cover">
	<div class="c20 center-box text-align-center">
		<img id="home-cover-logo" src="<?php echo G\Render\get_theme_file_url('img/g-white.svg'); ?>" alt="G\" width="60" height="60">
		<h1>Ready to begin the fun</h1>
		<p>This is just a default welcome page to G\ which is at <?php echo G\absolute_to_relative(__FILE__); ?></p>
		<div>
			<a href="https://github.com/rberrios/G" class="btn btn-big c5 margin-right-5">G\ on GitHub</a><a href="http://gbackslash.com/docs" class="btn btn-big c5">documentation</a>
		</div>
	</div>
</div>

<div class="content-block content-width overflow-auto text-align-justify">
	<div class="margin-bottom-40 overflow-auto">
		<div class="c2 grid-columns gutter-margin-right">
			<span class="icon-features icon-flag"></span>
		</div>
		<div class="c22 grid-columns">
			<h2>Getting started</h2>
			<p>If you are seeying this then G\ is ready to rock. You will find that G\ comes with an example app ("APP") which illustrates how the basic system works. Check the code and remember to read the <a href="http://gbackslash.com/docs">G\ documentation</a>.</p>
			<p>Visual style in this page is provided by <a href="http://peafowl.co">Peafowl</a> framework and here is some system info:</p>
			<ul class="tabbed-content-list table-li margin-top-20">
			<?php
				foreach(get_system_values() as $v) {
			?>
			<li><span class="c6 display-table-cell"><?php echo $v['label']; ?></span> <span class="display-table-cell"><?php echo $v['content']; ?></span></li>
			<?php
				}
			?>
		</ul>
		</div>
	</div>
</div>

<?php G\render\include_theme_file('footer'); ?>